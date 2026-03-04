package com.mrpaulwoods.promptvault.backend.integration;

import com.mrpaulwoods.promptvault.backend.dto.FolderRequest;
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
class FolderIT extends IntegrationTestBase {

    private Cookie jwtCookie;

    @BeforeEach
    void setUp() throws Exception {
        jwtCookie = registerAndLogin("folder@example.com", "password123");
    }

    @Test
    void getAllFolders_WithNoFolders_ShouldReturnEmptyList() throws Exception {
        mockMvc.perform(get("/api/folders").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void createFolder_ShouldReturnCreatedFolder() throws Exception {
        FolderRequest request = FolderRequest.builder().name("My Folder").build();

        mockMvc.perform(post("/api/folders")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Folder"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void createFolder_WithDuplicateName_ShouldReturn409() throws Exception {
        FolderRequest request = FolderRequest.builder().name("Duplicate").build();

        mockMvc.perform(post("/api/folders")
                .cookie(jwtCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        mockMvc.perform(post("/api/folders")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void getAllFolders_AfterCreate_ShouldReturnFolder() throws Exception {
        FolderRequest request = FolderRequest.builder().name("Listed Folder").build();
        mockMvc.perform(post("/api/folders")
                .cookie(jwtCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        mockMvc.perform(get("/api/folders").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Listed Folder"));
    }

    @Test
    void renameFolder_ShouldUpdateName() throws Exception {
        FolderRequest create = FolderRequest.builder().name("Original").build();
        String body = mockMvc.perform(post("/api/folders")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andReturn().getResponse().getContentAsString();

        String folderId = objectMapper.readTree(body).get("id").asText();

        FolderRequest rename = FolderRequest.builder().name("Renamed").build();
        mockMvc.perform(put("/api/folders/{id}", folderId)
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rename)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed"));
    }

    @Test
    void renameFolder_WithNonExistentId_ShouldReturn404() throws Exception {
        FolderRequest request = FolderRequest.builder().name("New Name").build();

        mockMvc.perform(put("/api/folders/{id}", "00000000-0000-0000-0000-000000000000")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteFolder_WithModeDelete_ShouldReturn204() throws Exception {
        FolderRequest create = FolderRequest.builder().name("To Delete").build();
        String body = mockMvc.perform(post("/api/folders")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andReturn().getResponse().getContentAsString();

        String folderId = objectMapper.readTree(body).get("id").asText();

        mockMvc.perform(delete("/api/folders/{id}", folderId)
                        .cookie(jwtCookie)
                        .param("mode", "delete"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/folders").cookie(jwtCookie))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deleteFolder_WithModeMove_ShouldReturn204() throws Exception {
        FolderRequest create = FolderRequest.builder().name("Move Source").build();
        String body = mockMvc.perform(post("/api/folders")
                        .cookie(jwtCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andReturn().getResponse().getContentAsString();

        String folderId = objectMapper.readTree(body).get("id").asText();

        mockMvc.perform(delete("/api/folders/{id}", folderId)
                        .cookie(jwtCookie)
                        .param("mode", "move"))
                .andExpect(status().isNoContent());
    }

    @Test
    void getAllFolders_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/folders"))
                .andExpect(status().is4xxClientError());
    }
}
