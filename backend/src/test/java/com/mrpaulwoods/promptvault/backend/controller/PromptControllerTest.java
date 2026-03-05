package com.mrpaulwoods.promptvault.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.PromptService;
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
class PromptControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @Mock
    private PromptService promptService;

    @InjectMocks
    private PromptController promptController;

    private UUID userId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(promptController)
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

        mockMvc.perform(get("/api/prompts"))
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

        mockMvc.perform(get("/api/prompts/{id}", promptId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(promptId.toString()));
    }

    @Test
    void getPrompt_WhenNotFound_ShouldReturn404() throws Exception {
        UUID promptId = UUID.randomUUID();
        when(promptService.getPrompt(eq(promptId), any(UUID.class)))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"));

        mockMvc.perform(get("/api/prompts/{id}", promptId))
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

        mockMvc.perform(delete("/api/prompts/{id}", promptId))
                .andExpect(status().isNoContent());
    }

    @Test
    void deletePrompt_WhenNotFound_ShouldReturn404() throws Exception {
        UUID promptId = UUID.randomUUID();
        doThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"))
                .when(promptService).deletePrompt(eq(promptId), any(UUID.class));

        mockMvc.perform(delete("/api/prompts/{id}", promptId))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchPrompts_ShouldReturnMatchingResults() throws Exception {
        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .title("Matching Prompt")
                .build();

        when(promptService.searchPrompts(userId, "match")).thenReturn(List.of(response));

        mockMvc.perform(get("/api/prompts/search").param("q", "match"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Matching Prompt"));
    }

    @Test
    void filterPrompts_ByFavorite_ShouldReturnFilteredResults() throws Exception {
        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .title("Favorite Prompt")
                .isFavorite(true)
                .build();

        when(promptService.filterPrompts(eq(userId), any(), any(), eq(true))).thenReturn(List.of(response));

        mockMvc.perform(get("/api/prompts/filter").param("favorite", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Favorite Prompt"));
    }

    @Test
    void filterPrompts_ByTagId_ShouldReturnFilteredResults() throws Exception {
        UUID tagId = UUID.randomUUID();
        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .title("Tagged Prompt")
                .build();

        when(promptService.filterPrompts(eq(userId), any(), eq(tagId), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/prompts/filter").param("tagId", tagId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Tagged Prompt"));
    }
}
