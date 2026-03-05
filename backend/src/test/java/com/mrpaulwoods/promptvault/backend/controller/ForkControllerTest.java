package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.ForkService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.GONE;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ForkControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ForkService forkService;

    @InjectMocks
    private ForkController forkController;

    private UUID userId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(forkController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        userId = UUID.randomUUID();
        mockUser = User.builder()
                .id(userId)
                .email("forker@example.com")
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
    void fork_ShouldReturn200WithForkedPrompt() throws Exception {
        UUID originalId = UUID.randomUUID();
        PromptResponse response = PromptResponse.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title("Forked Title")
                .currentBody("<p>body</p>")
                .isFavorite(false)
                .forkedFromPromptId(originalId)
                .forkedFromAuthor("author@example.com")
                .rowVersion(0)
                .tagIds(List.of())
                .build();

        when(forkService.forkFromShareToken(eq("validtoken"), eq(userId))).thenReturn(response);

        mockMvc.perform(post("/api/fork/{token}", "validtoken"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Forked Title"))
                .andExpect(jsonPath("$.forkedFromAuthor").value("author@example.com"));
    }

    @Test
    void fork_WhenTokenNotFound_ShouldReturn404() throws Exception {
        when(forkService.forkFromShareToken(eq("badtoken"), any()))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Share link not found"));

        mockMvc.perform(post("/api/fork/{token}", "badtoken"))
                .andExpect(status().isNotFound());
    }

    @Test
    void fork_WhenExpired_ShouldReturn410() throws Exception {
        when(forkService.forkFromShareToken(eq("expiredtoken"), any()))
                .thenThrow(new ResponseStatusException(GONE, "Share link has expired"));

        mockMvc.perform(post("/api/fork/{token}", "expiredtoken"))
                .andExpect(status().isGone());
    }
}
