package com.mrpaulwoods.promptvault.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.PromptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PromptControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private PromptService promptService;
    @MockitoBean
    private UserDetailsService userDetailsService;
    private UUID userId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mockUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .passwordHash("password")
                .build();
    }

    @Test
    void createPrompt_ShouldReturnCreatedPrompt() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("Test Title")
                .currentBody("Test Body")
                .isFavorite(false)
                .build();

        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Title")
                .currentBody("Test Body")
                .isFavorite(false)
                .build();

        when(promptService.createPrompt(eq(userId), any(PromptRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/prompts")
                        .with(user(mockUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Title"))
                .andExpect(jsonPath("$.currentBody").value("Test Body"));
    }

    @Test
    void getAllPrompts_ShouldReturnList() throws Exception {
        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Title")
                .build();

        when(promptService.getAllPrompts(userId)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/prompts")
                        .with(user(mockUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Test Title"));
    }

    @Test
    void getPrompt_ShouldReturnPrompt() throws Exception {
        UUID promptId = UUID.randomUUID();
        PromptResponse response = PromptResponse.builder()
                .id(promptId)
                .title("Test Title")
                .build();

        when(promptService.getPrompt(promptId, userId)).thenReturn(response);

        mockMvc.perform(get("/api/prompts/{id}", promptId)
                        .with(user(mockUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(promptId.toString()));
    }

    @Test
    void getPrompt_WhenNotFound_ShouldReturn404() throws Exception {
        UUID promptId = UUID.randomUUID();
        when(promptService.getPrompt(eq(promptId), any(UUID.class)))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"));

        mockMvc.perform(get("/api/prompts/{id}", promptId)
                        .with(user(mockUser)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatePrompt_ShouldReturnUpdatedPrompt() throws Exception {
        UUID promptId = UUID.randomUUID();
        PromptRequest request = PromptRequest.builder()
                .title("Updated Title")
                .currentBody("Updated Body")
                .isFavorite(true)
                .build();

        PromptResponse response = PromptResponse.builder()
                .id(promptId)
                .title("Updated Title")
                .currentBody("Updated Body")
                .isFavorite(true)
                .build();

        when(promptService.updatePrompt(eq(promptId), eq(userId), any(PromptRequest.class), eq(1)))
                .thenReturn(response);

        mockMvc.perform(put("/api/prompts/{id}", promptId)
                        .with(user(mockUser))
                        .param("rowVersion", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    void deletePrompt_ShouldReturn204() throws Exception {
        UUID promptId = UUID.randomUUID();
        doNothing().when(promptService).deletePrompt(promptId, userId);

        mockMvc.perform(delete("/api/prompts/{id}", promptId)
                        .with(user(mockUser)))
                .andExpect(status().isNoContent());
    }

    @Test
    void deletePrompt_WhenNotFound_ShouldReturn404() throws Exception {
        UUID promptId = UUID.randomUUID();
        doThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"))
                .when(promptService).deletePrompt(eq(promptId), any(UUID.class));

        mockMvc.perform(delete("/api/prompts/{id}", promptId)
                        .with(user(mockUser)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createPrompt_WhenUnauthenticated_ShouldReturn401Or403() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("Test Title")
                .currentBody("Test Body")
                .isFavorite(false)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }
}
