package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.service.AuthService;
import com.mrpaulwoods.promptvault.backend.service.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerPasswordResetTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private PasswordResetService passwordResetService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    void requestPasswordReset_ShouldReturn200() throws Exception {
        doNothing().when(passwordResetService).requestReset("user@example.com");

        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.com\"}"))
                .andExpect(status().isOk());

        verify(passwordResetService).requestReset("user@example.com");
    }

    @Test
    void requestPasswordReset_WithInvalidEmail_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());

        verify(passwordResetService, never()).requestReset(any());
    }

    @Test
    void requestPasswordReset_WithMissingEmail_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(passwordResetService, never()).requestReset(any());
    }

    @Test
    void confirmPasswordReset_ShouldReturn200() throws Exception {
        doNothing().when(passwordResetService).confirmReset("sometoken", "newpassword");

        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"sometoken\",\"newPassword\":\"newpassword\"}"))
                .andExpect(status().isOk());

        verify(passwordResetService).confirmReset("sometoken", "newpassword");
    }

    @Test
    void confirmPasswordReset_WithInvalidToken_ShouldReturn400() throws Exception {
        doThrow(new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset token"))
                .when(passwordResetService).confirmReset("badtoken", "newpassword");

        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"badtoken\",\"newPassword\":\"newpassword\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void confirmPasswordReset_WithShortPassword_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"sometoken\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest());

        verify(passwordResetService, never()).confirmReset(any(), any());
    }
}
