package com.mrpaulwoods.promptvault.backend.integration;

import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "classpath:cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class PromptSearchIT extends IntegrationTestBase {

    private Cookie jwtCookie;

    @BeforeEach
    void setUp() throws Exception {
        jwtCookie = registerAndLogin("search@example.com", "password123");
    }

    private String createPrompt(String title, String body, Boolean favorite) throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title(title)
                .currentBody(body)
                .isFavorite(favorite)
                .build();

        String response = mockMvc.perform(post("/api/prompts")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    private String createPromptInFolder(String title, String body, String folderId) throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title(title)
                .currentBody(body)
                .isFavorite(false)
                .build();

        String json = objectMapper.writeValueAsString(request);
        // Inject folderId manually since builder doesn't have it as a param here
        json = json.replace("}", ",\"folderId\":\"" + folderId + "\"}");

        String response = mockMvc.perform(post("/api/prompts")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    @Test
    @Disabled("Test doesn't work since database is h2 and uses postgres full text search")
    void searchPrompts_WithMatchingQuery_ShouldReturnResults() throws Exception {
        createPrompt("Spring Boot Guide", "A guide about Spring Boot framework", false);
        createPrompt("React Tutorial", "Learn React hooks and components", false);

        mockMvc.perform(get("/api/prompts/search")
                        .cookie(jwtCookie)
                        .param("q", "Spring Boot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].title").value("Spring Boot Guide"));
    }

    @Test
    @Disabled("Test doesn't work since database is h2 and uses postgres full text search")
    void searchPrompts_WithNonMatchingQuery_ShouldReturnEmpty() throws Exception {
        createPrompt("Spring Boot Guide", "A guide about Spring Boot framework", false);

        mockMvc.perform(get("/api/prompts/search")
                        .cookie(jwtCookie)
                        .param("q", "kubernetes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void searchPrompts_WithBlankQuery_ShouldReturnAllPrompts() throws Exception {
        createPrompt("Prompt One", "body one", false);
        createPrompt("Prompt Two", "body two", false);

        mockMvc.perform(get("/api/prompts/search")
                        .cookie(jwtCookie)
                        .param("q", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void filterPrompts_ByFavorite_ShouldReturnOnlyFavorites() throws Exception {
        createPrompt("Favorite Prompt", "body", true);
        createPrompt("Regular Prompt", "body", false);

        mockMvc.perform(get("/api/prompts/filter")
                        .cookie(jwtCookie)
                        .param("favorite", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Favorite Prompt"));
    }

    @Test
    void filterPrompts_WithNoFilters_ShouldReturnAllPrompts() throws Exception {
        createPrompt("Prompt A", "body a", false);
        createPrompt("Prompt B", "body b", true);

        mockMvc.perform(get("/api/prompts/filter").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @Disabled("Test doesn't work since database is h2 and uses postgres full text search")
    void searchPrompts_ShouldNotReturnOtherUsersPrompts() throws Exception {
        createPrompt("My Spring Prompt", "content about spring", false);

        Cookie otherCookie = registerAndLogin("other-search@example.com", "password123");

        mockMvc.perform(get("/api/prompts/search")
                        .cookie(otherCookie)
                        .param("q", "spring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void filterPrompts_ShouldNotReturnOtherUsersPrompts() throws Exception {
        createPrompt("My Prompt", "body", true);

        Cookie otherCookie = registerAndLogin("other-filter@example.com", "password123");

        mockMvc.perform(get("/api/prompts/filter")
                        .cookie(otherCookie)
                        .param("favorite", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void searchPrompts_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/prompts/search").param("q", "test"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void filterPrompts_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/prompts/filter").param("favorite", "true"))
                .andExpect(status().is4xxClientError());
    }
}
