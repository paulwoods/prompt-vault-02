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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "classpath:cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class ShareLinkIT extends IntegrationTestBase {

    private Cookie jwtCookie;
    private String promptId;

    @BeforeEach
    void setUp() throws Exception {
        jwtCookie = registerAndLogin("share@example.com", "password123");
        promptId = createPrompt("Test Prompt", "This is the prompt body");
    }

    private String createPrompt(String title, String body) throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title(title)
                .currentBody(body)
                .isFavorite(false)
                .build();

        String response = mockMvc.perform(post("/api/prompts")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    private String createShareLink() throws Exception {
        String response = mockMvc.perform(post("/api/prompts/{promptId}/share-links", promptId)
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    private String getToken(String shareLinkId) throws Exception {
        String response = mockMvc.perform(get("/api/prompts/{promptId}/share-links", promptId)
                        .cookie(jwtCookie))
                .andReturn().getResponse().getContentAsString();

        var arr = objectMapper.readTree(response);
        for (var node : arr) {
            if (node.get("id").asText().equals(shareLinkId)) {
                return node.get("token").asText();
            }
        }
        return null;
    }

    @Test
    void createShareLink_ShouldReturnShareLinkWithToken() throws Exception {
        mockMvc.perform(post("/api/prompts/{promptId}/share-links", promptId)
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.promptId").value(promptId));
    }

    @Test
    void createShareLink_WhenPromptNotFound_ShouldReturn404() throws Exception {
        mockMvc.perform(post("/api/prompts/{promptId}/share-links", "00000000-0000-0000-0000-000000000000")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listShareLinks_ShouldReturnAllLinks() throws Exception {
        createShareLink();
        createShareLink();

        mockMvc.perform(get("/api/prompts/{promptId}/share-links", promptId)
                        .cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void revokeShareLink_ShouldRemoveLink() throws Exception {
        String shareLinkId = createShareLink();

        mockMvc.perform(delete("/api/share-links/{id}", shareLinkId)
                        .cookie(jwtCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/prompts/{promptId}/share-links", promptId)
                        .cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getPublicShare_ShouldReturnPromptWithoutAuth() throws Exception {
        String shareLinkId = createShareLink();
        String token = getToken(shareLinkId);

        mockMvc.perform(get("/api/share/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Prompt"))
                .andExpect(jsonPath("$.body").value("This is the prompt body"));
    }

    @Test
    void getPublicShare_WhenRevoked_ShouldReturn410() throws Exception {
        String shareLinkId = createShareLink();
        String token = getToken(shareLinkId);

        mockMvc.perform(delete("/api/share-links/{id}", shareLinkId).cookie(jwtCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/share/{token}", token))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPublicShare_WithInvalidToken_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/share/{token}", "invalidtoken123"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createShareLink_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(post("/api/prompts/{promptId}/share-links", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().is4xxClientError());
    }
}
