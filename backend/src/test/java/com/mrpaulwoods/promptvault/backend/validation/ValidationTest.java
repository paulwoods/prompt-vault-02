package com.mrpaulwoods.promptvault.backend.validation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.LoginRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.RegisterRequest;
import com.mrpaulwoods.promptvault.backend.service.AuthService;
import com.mrpaulwoods.promptvault.backend.service.PromptService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ValidationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private PromptService promptService;

    @Test
    void register_withInvalidEmail_shouldReturnBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("invalid-email");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_withShortPassword_shouldReturnBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_withBlankEmail_shouldReturnBadRequest() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("");
        request.setPassword("password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void createPrompt_withBlankTitle_shouldReturnBadRequest() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("")
                .currentBody("Some body")
                .isFavorite(true)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void createPrompt_withNullIsFavorite_shouldReturnBadRequest() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("Title")
                .currentBody("Some body")
                .isFavorite(null)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void createPrompt_withTooLongBody_shouldReturnBadRequest() throws Exception {
        PromptRequest request = PromptRequest.builder()
                .title("Title")
                .currentBody("a".repeat(10001))
                .isFavorite(true)
                .build();

        mockMvc.perform(post("/api/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
