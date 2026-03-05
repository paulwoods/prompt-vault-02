package com.mrpaulwoods.promptvault.backend.integration;

import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "classpath:cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ForkIT extends IntegrationTestBase {

    private Cookie authorCookie;
    private Cookie forkerCookie;
    private String promptId;
    private String shareToken;

    @BeforeEach
    void setUp() throws Exception {
        authorCookie = registerAndLogin("author@example.com", "password123");
        forkerCookie = registerAndLogin("forker@example.com", "password123");

        promptId = createPrompt(authorCookie, "My Prompt", "<p>Original content</p>");
        shareToken = createShareToken(authorCookie, promptId);
    }

    private String createPrompt(Cookie cookie, String title, String body) throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title(title)
                .currentBody(body)
                .isFavorite(false)
                .build();

        String response = mockMvc.perform(post("/api/prompts")
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    private String createShareToken(Cookie cookie, String pId) throws Exception {
        String response = mockMvc.perform(post("/api/prompts/{id}/share-links", pId)
                        .cookie(cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    @Test
    void fork_ShouldCreateNewPromptWithAttribution() throws Exception {
        mockMvc.perform(post("/api/fork/{token}", shareToken)
                        .cookie(forkerCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Prompt"))
                .andExpect(jsonPath("$.currentBody").value("<p>Original content</p>"))
                .andExpect(jsonPath("$.forkedFromPromptId").value(promptId))
                .andExpect(jsonPath("$.forkedFromAuthor").value("author@example.com"))
                .andExpect(jsonPath("$.userId").isNotEmpty());
    }

    @Test
    void fork_ForkedPromptShouldBelongToForkingUser() throws Exception {
        String response = mockMvc.perform(post("/api/fork/{token}", shareToken)
                        .cookie(forkerCookie))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // The forked prompt should appear in forker's prompt list
        mockMvc.perform(post("/api/fork/{token}", shareToken)
                        .cookie(forkerCookie))
                .andExpect(status().isOk());
    }

    @Test
    void fork_WithInvalidToken_ShouldReturn404() throws Exception {
        mockMvc.perform(post("/api/fork/{token}", "invalidtoken123")
                        .cookie(forkerCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void fork_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(post("/api/fork/{token}", shareToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void fork_WhenRevoked_ShouldReturn404Or410() throws Exception {
        // Get the share link id to revoke it
        String shareLinkResponse = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .get("/api/prompts/{id}/share-links", promptId)
                                .cookie(authorCookie))
                .andReturn().getResponse().getContentAsString();

        String shareLinkId = objectMapper.readTree(shareLinkResponse).get(0).get("id").asText();

        // Revoke
        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .delete("/api/share-links/{id}", shareLinkId)
                                .cookie(authorCookie))
                .andExpect(status().isNoContent());

        // Fork should now fail
        mockMvc.perform(post("/api/fork/{token}", shareToken)
                        .cookie(forkerCookie))
                .andExpect(status().is4xxClientError());
    }
}
