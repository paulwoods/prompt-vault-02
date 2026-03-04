package com.mrpaulwoods.promptvault.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.FolderRequest;
import com.mrpaulwoods.promptvault.backend.dto.FolderResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.FolderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FolderControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @Mock
    private FolderService folderService;

    @InjectMocks
    private FolderController folderController;

    private UUID userId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(folderController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        userId = UUID.randomUUID();
        mockUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .passwordHash("password")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(mockUser, null, mockUser.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAllFolders_ShouldReturnFolderList() throws Exception {
        FolderResponse folder = FolderResponse.builder()
                .id(UUID.randomUUID())
                .name("My Folder")
                .build();

        when(folderService.getAllFolders(userId)).thenReturn(List.of(folder));

        mockMvc.perform(get("/api/folders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("My Folder"));
    }

    @Test
    void createFolder_ShouldReturnCreatedFolder() throws Exception {
        FolderRequest request = FolderRequest.builder().name("New Folder").build();
        FolderResponse response = FolderResponse.builder()
                .id(UUID.randomUUID())
                .name("New Folder")
                .build();

        when(folderService.createFolder(eq(userId), any(FolderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/folders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Folder"));
    }

    @Test
    void renameFolder_ShouldReturnUpdatedFolder() throws Exception {
        UUID folderId = UUID.randomUUID();
        FolderRequest request = FolderRequest.builder().name("Renamed Folder").build();
        FolderResponse response = FolderResponse.builder()
                .id(folderId)
                .name("Renamed Folder")
                .build();

        when(folderService.renameFolder(eq(folderId), eq(userId), any(FolderRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/folders/{id}", folderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Folder"));
    }

    @Test
    void renameFolder_WhenNotFound_ShouldReturn404() throws Exception {
        UUID folderId = UUID.randomUUID();
        FolderRequest request = FolderRequest.builder().name("Renamed Folder").build();

        when(folderService.renameFolder(eq(folderId), any(UUID.class), any(FolderRequest.class)))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Folder not found"));

        mockMvc.perform(put("/api/folders/{id}", folderId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteFolder_WithModeMoveToRoot_ShouldReturn204() throws Exception {
        UUID folderId = UUID.randomUUID();
        doNothing().when(folderService).deleteFolder(folderId, userId, "move", null);

        mockMvc.perform(delete("/api/folders/{id}", folderId)
                        .param("mode", "move"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteFolder_WithModeDelete_ShouldReturn204() throws Exception {
        UUID folderId = UUID.randomUUID();
        doNothing().when(folderService).deleteFolder(folderId, userId, "delete", null);

        mockMvc.perform(delete("/api/folders/{id}", folderId)
                        .param("mode", "delete"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteFolder_WhenNotFound_ShouldReturn404() throws Exception {
        UUID folderId = UUID.randomUUID();
        doThrow(new ResponseStatusException(NOT_FOUND, "Folder not found"))
                .when(folderService).deleteFolder(eq(folderId), any(UUID.class), eq("delete"), eq(null));

        mockMvc.perform(delete("/api/folders/{id}", folderId)
                        .param("mode", "delete"))
                .andExpect(status().isNotFound());
    }
}
