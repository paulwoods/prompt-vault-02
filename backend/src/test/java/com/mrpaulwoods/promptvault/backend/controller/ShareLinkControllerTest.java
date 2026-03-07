package com.mrpaulwoods.promptvault.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.PublicShareResponse;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.ShareLinkService;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ShareLinkControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @Mock
    private ShareLinkService shareLinkService;

    @InjectMocks
    private ShareLinkController shareLinkController;

    private UUID userId;
    private UUID promptId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(shareLinkController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        userId = UUID.randomUUID();
        promptId = UUID.randomUUID();
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
    void createShareLink_ShouldReturn200WithShareLink() throws Exception {
        ShareLinkResponse response = ShareLinkResponse.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("abc123")
                .createdAt(Instant.now())
                .active(true)
                .build();

        when(shareLinkService.createShareLink(eq(promptId), eq(userId), any())).thenReturn(response);

        mockMvc.perform(post("/api/prompts/{promptId}/share-links", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("abc123"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void createShareLink_WhenPromptNotFound_ShouldReturn404() throws Exception {
        when(shareLinkService.createShareLink(eq(promptId), eq(userId), any()))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"));

        mockMvc.perform(post("/api/prompts/{promptId}/share-links", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listShareLinks_ShouldReturn200WithList() throws Exception {
        ShareLinkResponse link1 = ShareLinkResponse.builder()
                .id(UUID.randomUUID()).promptId(promptId).token("t1").createdAt(Instant.now()).active(true).build();
        ShareLinkResponse link2 = ShareLinkResponse.builder()
                .id(UUID.randomUUID()).promptId(promptId).token("t2").createdAt(Instant.now()).active(true).build();

        when(shareLinkService.listShareLinks(promptId, userId)).thenReturn(List.of(link1, link2));

        mockMvc.perform(get("/api/prompts/{promptId}/share-links", promptId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void updateExpiration_ShouldReturn200() throws Exception {
        UUID shareLinkId = UUID.randomUUID();
        ShareLinkResponse response = ShareLinkResponse.builder()
                .id(shareLinkId).promptId(promptId).token("t1")
                .createdAt(Instant.now()).active(true).build();

        when(shareLinkService.updateExpiration(eq(shareLinkId), eq(userId), any())).thenReturn(response);

        mockMvc.perform(put("/api/share-links/{id}", shareLinkId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"expiresAt\":\"2026-12-31T00:00:00Z\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(shareLinkId.toString()));
    }

    @Test
    void revokeShareLink_ShouldReturn204() throws Exception {
        UUID shareLinkId = UUID.randomUUID();

        mockMvc.perform(delete("/api/share-links/{id}", shareLinkId))
                .andExpect(status().isNoContent());
    }

    @Test
    void revokeShareLink_WhenNotFound_ShouldReturn404() throws Exception {
        UUID shareLinkId = UUID.randomUUID();
        doThrow(new ResponseStatusException(NOT_FOUND, "Share link not found"))
                .when(shareLinkService).revokeShareLink(eq(shareLinkId), eq(userId));

        mockMvc.perform(delete("/api/share-links/{id}", shareLinkId))
                .andExpect(status().isNotFound());
    }

    @Test
    void getPublicShare_ShouldReturn200WithContent() throws Exception {
        String token = "validtoken";
        PublicShareResponse response = PublicShareResponse.builder()
                .promptId(promptId)
                .title("My Prompt")
                .body("Prompt body here")
                .sharedAt(Instant.now())
                .build();

        when(shareLinkService.getPublicShare(token)).thenReturn(response);

        mockMvc.perform(get("/api/share/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Prompt"))
                .andExpect(jsonPath("$.body").value("Prompt body here"));
    }

    @Test
    void getPublicShare_WhenTokenNotFound_ShouldReturn404() throws Exception {
        when(shareLinkService.getPublicShare("badtoken"))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Share link not found"));

        mockMvc.perform(get("/api/share/{token}", "badtoken"))
                .andExpect(status().isNotFound());
    }

    @Test
    void emailShareLink_ShouldReturn200() throws Exception {
        mockMvc.perform(post("/api/prompts/{promptId}/share-links/email", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"recipientEmail\":\"recipient@example.com\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void emailShareLink_WithInvalidEmail_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/prompts/{promptId}/share-links/email", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"recipientEmail\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void emailShareLink_WhenPromptNotFound_ShouldReturn404() throws Exception {
        doThrow(new ResponseStatusException(NOT_FOUND, "Prompt not found"))
                .when(shareLinkService).emailShareLink(eq(promptId), eq(userId), any());

        mockMvc.perform(post("/api/prompts/{promptId}/share-links/email", promptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"recipientEmail\":\"recipient@example.com\"}"))
                .andExpect(status().isNotFound());
    }
}
