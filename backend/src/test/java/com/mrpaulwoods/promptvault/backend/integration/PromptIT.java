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
class PromptIT extends IntegrationTestBase {

    private Cookie jwtCookie;

    @BeforeEach
    void setUp() throws Exception {
        jwtCookie = registerAndLogin("prompt@example.com", "password123");
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
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    @Test
    void getAllPrompts_WithNoPrompts_ShouldReturnEmptyList() throws Exception {
        mockMvc.perform(get("/api/prompts").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createPrompt_ShouldReturnCreatedPrompt() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("My Prompt")
                .currentBody("This is the prompt body.")
                .isFavorite(false)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Prompt"))
                .andExpect(jsonPath("$.currentBody").value("This is the prompt body."))
                .andExpect(jsonPath("$.favorite").value(false))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.rowVersion").isNumber());
    }

    @Test
    void getAllPrompts_AfterCreate_ShouldReturnPrompt() throws Exception {
        createPrompt("Listed Prompt", "body");

        mockMvc.perform(get("/api/prompts").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Listed Prompt"));
    }

    @Test
    void getPrompt_ShouldReturnPromptById() throws Exception {
        String promptId = createPrompt("Fetched Prompt", "body content");

        mockMvc.perform(get("/api/prompts/{id}", promptId).cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(promptId))
                .andExpect(jsonPath("$.title").value("Fetched Prompt"));
    }

    @Test
    void getPrompt_WithNonExistentId_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/prompts/{id}", "00000000-0000-0000-0000-000000000000")
                        .cookie(jwtCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatePrompt_ShouldUpdateTitleAndBody() throws Exception {
        PromptRequest create = PromptRequest.builder()
                .title("Original Title")
                .currentBody("Original body")
                .isFavorite(false)
                .build();

        String createBody = mockMvc.perform(post("/api/prompts")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andReturn().getResponse().getContentAsString();

        String promptId = objectMapper.readTree(createBody).get("id").asText();
        int rowVersion = objectMapper.readTree(createBody).get("rowVersion").asInt();

        PromptRequest update = PromptRequest.builder()
                .title("Updated Title")
                .currentBody("Updated body")
                .isFavorite(true)
                .build();

        mockMvc.perform(put("/api/prompts/{id}", promptId)
                        .cookie(jwtCookie)
                        .param("rowVersion", String.valueOf(rowVersion))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.currentBody").value("Updated body"))
                .andExpect(jsonPath("$.favorite").value(true));
    }

    @Test
    void updatePrompt_WithStaleRowVersion_ShouldReturn409() throws Exception {
        String promptId = createPrompt("Stale Test", "body");

        PromptRequest update = PromptRequest.builder()
                .title("Updated")
                .currentBody("Updated body")
                .isFavorite(false)
                .build();

        mockMvc.perform(put("/api/prompts/{id}", promptId)
                        .cookie(jwtCookie)
                        .param("rowVersion", "999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isConflict());
    }

    @Test
    void deletePrompt_ShouldReturn204AndRemoveFromList() throws Exception {
        String promptId = createPrompt("To Delete", "body");

        mockMvc.perform(delete("/api/prompts/{id}", promptId).cookie(jwtCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/prompts").cookie(jwtCookie))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deletePrompt_WithNonExistentId_ShouldReturn404() throws Exception {
        mockMvc.perform(delete("/api/prompts/{id}", "00000000-0000-0000-0000-000000000000")
                        .cookie(jwtCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void createPrompt_WithBlankTitle_ShouldReturn400() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("")
                .currentBody("body")
                .isFavorite(false)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllPrompts_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/prompts"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void promptsFromOtherUser_ShouldNotBeVisible() throws Exception {
        createPrompt("User1 Prompt", "body");

        Cookie otherUserCookie = registerAndLogin("other@example.com", "password123");

        mockMvc.perform(get("/api/prompts").cookie(otherUserCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
