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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(mockUser);
    }

    @Test
    @WithMockUser(username = "test@example.com")
    void createPrompt_ShouldReturnCreatedPrompt() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("Test Title")
                .currentBody("Test Body")
                .isFavorite(true)
                .build();

        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .title("Test Title")
                .currentBody("Test Body")
                .isFavorite(true)
                .build();

        when(promptService.createPrompt(eq(userId), any(PromptRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Title"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
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
}
