package com.mrpaulwoods.promptvault.backend.integration;

import com.mrpaulwoods.promptvault.backend.dto.TagRequest;
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
class TagIT extends IntegrationTestBase {

    private Cookie jwtCookie;

    @BeforeEach
    void setUp() throws Exception {
        jwtCookie = registerAndLogin("tag@example.com", "password123");
    }

    @Test
    void getAllTags_WithNoTags_ShouldReturnEmptyList() throws Exception {
        mockMvc.perform(get("/api/tags").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createTag_ShouldReturnCreatedTag() throws Exception {
        TagRequest request = TagRequest.builder().name("java").comments("Java language").build();

        mockMvc.perform(post("/api/tags")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("java"))
                .andExpect(jsonPath("$.comments").value("Java language"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void getAllTags_AfterCreate_ShouldReturnTag() throws Exception {
        TagRequest request = TagRequest.builder().name("listed-tag").build();
        mockMvc.perform(post("/api/tags")
                .cookie(jwtCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        mockMvc.perform(get("/api/tags").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("listed-tag"));
    }

    @Test
    void updateTag_ShouldUpdateNameAndComments() throws Exception {
        TagRequest create = TagRequest.builder().name("original-tag").build();
        String body = mockMvc.perform(post("/api/tags")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andReturn().getResponse().getContentAsString();

        String tagId = objectMapper.readTree(body).get("id").asText();

        TagRequest update = TagRequest.builder().name("updated-tag").comments("new comment").build();
        mockMvc.perform(put("/api/tags/{id}", tagId)
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("updated-tag"))
                .andExpect(jsonPath("$.comments").value("new comment"));
    }

    @Test
    void updateTag_WithNonExistentId_ShouldReturn404() throws Exception {
        TagRequest update = TagRequest.builder().name("no-such-tag").build();

        mockMvc.perform(put("/api/tags/{id}", "00000000-0000-0000-0000-000000000000")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteTag_ShouldReturn204AndRemoveTag() throws Exception {
        TagRequest create = TagRequest.builder().name("to-delete").build();
        String body = mockMvc.perform(post("/api/tags")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andReturn().getResponse().getContentAsString();

        String tagId = objectMapper.readTree(body).get("id").asText();

        mockMvc.perform(delete("/api/tags/{id}", tagId).cookie(jwtCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/tags").cookie(jwtCookie))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deleteTag_WithNonExistentId_ShouldReturn404() throws Exception {
        mockMvc.perform(delete("/api/tags/{id}", "00000000-0000-0000-0000-000000000000")
                        .cookie(jwtCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllTags_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/tags"))
                .andExpect(status().is4xxClientError());
    }
}
