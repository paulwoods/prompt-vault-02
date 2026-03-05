package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.entity.ShareLink;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ForkServiceTest {

    @Mock
    private ShareLinkRepository shareLinkRepository;
    @Mock
    private PromptRepository promptRepository;
    @Mock
    private PromptVersionRepository promptVersionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private ForkService forkService;

    private UUID originalOwnerId;
    private UUID forkingUserId;
    private UUID promptId;
    private Prompt originalPrompt;
    private ShareLink shareLink;
    private User originalOwner;

    @BeforeEach
    void setUp() {
        originalOwnerId = UUID.randomUUID();
        forkingUserId = UUID.randomUUID();
        promptId = UUID.randomUUID();

        originalOwner = User.builder()
                .id(originalOwnerId)
                .email("author@example.com")
                .passwordHash("hash")
                .build();

        originalPrompt = Prompt.builder()
                .id(promptId)
                .userId(originalOwnerId)
                .title("Original Title")
                .currentBody("<p>Original body</p>")
                .isFavorite(false)
                .rowVersion(1)
                .build();

        shareLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("validtoken123")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void forkFromShareToken_ShouldCreateForkedPromptWithAttribution() {
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("validtoken123")).thenReturn(Optional.of(shareLink));
        when(promptRepository.findById(promptId)).thenReturn(Optional.of(originalPrompt));
        when(userRepository.findById(originalOwnerId)).thenReturn(Optional.of(originalOwner));

        Prompt savedFork = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(forkingUserId)
                .title("Original Title")
                .currentBody("<p>Original body</p>")
                .forkedFromPromptId(promptId)
                .forkedFromAuthor("author@example.com")
                .rowVersion(0)
                .build();
        when(promptRepository.save(any())).thenReturn(savedFork);
        when(promptVersionRepository.save(any())).thenReturn(null);
        when(tagRepository.findTagsByPromptId(any())).thenReturn(List.of());

        PromptResponse response = forkService.forkFromShareToken("validtoken123", forkingUserId);

        assertThat(response.getTitle()).isEqualTo("Original Title");
        assertThat(response.getForkedFromPromptId()).isEqualTo(promptId);
        assertThat(response.getForkedFromAuthor()).isEqualTo("author@example.com");
        verify(promptRepository).save(any());
        verify(promptVersionRepository).save(any());
    }

    @Test
    void forkFromShareToken_WhenTokenNotFound_ShouldThrow404() {
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("badtoken")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forkService.forkFromShareToken("badtoken", forkingUserId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Share link not found");
    }

    @Test
    void forkFromShareToken_WhenRevoked_ShouldThrow410() {
        ShareLink revokedLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("revokedtoken")
                .revokedAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();

        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("revokedtoken")).thenReturn(Optional.of(revokedLink));

        assertThatThrownBy(() -> forkService.forkFromShareToken("revokedtoken", forkingUserId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    void forkFromShareToken_WhenExpired_ShouldThrow410() {
        ShareLink expiredLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("expiredtoken")
                .expiresAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();

        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("expiredtoken")).thenReturn(Optional.of(expiredLink));

        assertThatThrownBy(() -> forkService.forkFromShareToken("expiredtoken", forkingUserId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void forkFromShareToken_WhenOriginalPromptDeleted_ShouldThrow404() {
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("validtoken123")).thenReturn(Optional.of(shareLink));

        Prompt deletedPrompt = Prompt.builder()
                .id(promptId)
                .userId(originalOwnerId)
                .title("Deleted Prompt")
                .currentBody("body")
                .deletedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build();
        when(promptRepository.findById(promptId)).thenReturn(Optional.of(deletedPrompt));

        assertThatThrownBy(() -> forkService.forkFromShareToken("validtoken123", forkingUserId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("no longer available");
    }

    @Test
    void forkFromShareToken_WhenOriginalPromptMissing_ShouldThrow404() {
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("validtoken123")).thenReturn(Optional.of(shareLink));
        when(promptRepository.findById(promptId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> forkService.forkFromShareToken("validtoken123", forkingUserId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("no longer available");
    }

    @Test
    void forkFromShareToken_WhenAuthorNotFound_ShouldUseUnknown() {
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("validtoken123")).thenReturn(Optional.of(shareLink));
        when(promptRepository.findById(promptId)).thenReturn(Optional.of(originalPrompt));
        when(userRepository.findById(originalOwnerId)).thenReturn(Optional.empty());

        Prompt savedFork = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(forkingUserId)
                .title("Original Title")
                .currentBody("<p>Original body</p>")
                .forkedFromPromptId(promptId)
                .forkedFromAuthor("unknown")
                .rowVersion(0)
                .build();
        when(promptRepository.save(any())).thenReturn(savedFork);
        when(promptVersionRepository.save(any())).thenReturn(null);
        when(tagRepository.findTagsByPromptId(any())).thenReturn(List.of());

        PromptResponse response = forkService.forkFromShareToken("validtoken123", forkingUserId);

        assertThat(response.getForkedFromAuthor()).isEqualTo("unknown");
    }
}
