package com.mrpaulwoods.promptvault.backend.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.controller.PromptController;
import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.PromptService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @Mock
    private PromptService promptService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        PromptController controller = new PromptController(promptService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        userId = UUID.randomUUID();
        User mockUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .passwordHash("hash")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(mockUser, null, mockUser.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void whenValidationFails_shouldReturn400WithStructuredBody() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("")        // blank — triggers @NotBlank
                .currentBody("body")
                .isFavorite(false)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/prompts"));
    }

    @Test
    void whenPromptNotFound_shouldReturn404WithStructuredBody() throws Exception {
        UUID promptId = UUID.randomUUID();
        when(promptService.getPrompt(eq(promptId), any()))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"));

        mockMvc.perform(get("/api/prompts/{id}", promptId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Prompt not found"))
                .andExpect(jsonPath("$.path").value("/api/prompts/" + promptId));
    }

    @Test
    void whenConflict_shouldReturn409WithStructuredBody() throws Exception {
        UUID promptId = UUID.randomUUID();
        PromptRequest request = PromptRequest.builder()
                .title("Title")
                .currentBody("body")
                .isFavorite(false)
                .build();

        when(promptService.updatePrompt(eq(promptId), any(), any(), any()))
                .thenThrow(new ResponseStatusException(CONFLICT, "Prompt has been modified by another user"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/prompts/{id}", promptId)
                        .param("rowVersion", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Prompt has been modified by another user"));
    }

    @Test
    void whenUnhandledException_shouldReturn500WithStructuredBody() throws Exception {
        when(promptService.getAllPrompts(any()))
                .thenThrow(new RuntimeException("unexpected failure"));

        mockMvc.perform(get("/api/prompts"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    @Test
    void whenBodyTooLarge_shouldReturn400() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("Title")
                .currentBody("a".repeat(10001))
                .isFavorite(false)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
