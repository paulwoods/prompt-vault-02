package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.config.MailProperties;
import com.mrpaulwoods.promptvault.backend.dto.PublicShareResponse;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkRequest;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkResponse;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.entity.ShareLink;
import com.mrpaulwoods.promptvault.backend.repository.PromptRepository;
import com.mrpaulwoods.promptvault.backend.repository.ShareLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
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
class ShareLinkServiceTest {

    @Mock
    private ShareLinkRepository shareLinkRepository;

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MailProperties mailProperties;

    @InjectMocks
    private ShareLinkService shareLinkService;

    private UUID userId;
    private UUID promptId;
    private Prompt prompt;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        promptId = UUID.randomUUID();
        prompt = Prompt.builder()
                .id(promptId)
                .userId(userId)
                .title("Test Prompt")
                .currentBody("Body content")
                .build();
    }

    @Test
    void createShareLink_ShouldSaveAndReturnShareLink() {
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.of(prompt));

        ShareLink saved = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("abc123token")
                .createdAt(Instant.now())
                .build();
        when(shareLinkRepository.save(any())).thenReturn(saved);

        ShareLinkResponse response = shareLinkService.createShareLink(promptId, userId, null);

        assertThat(response.getPromptId()).isEqualTo(promptId);
        assertThat(response.isActive()).isTrue();
        verify(shareLinkRepository).save(any());
    }

    @Test
    void createShareLink_WhenPromptNotFound_ShouldThrow404() {
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.createShareLink(promptId, userId, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Prompt not found");
    }

    @Test
    void createShareLink_WithExpiration_ShouldSetExpiresAt() {
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);
        ShareLinkRequest request = ShareLinkRequest.builder().expiresAt(expiresAt).build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.of(prompt));

        ShareLink saved = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("abc123token")
                .expiresAt(expiresAt)
                .createdAt(Instant.now())
                .build();
        when(shareLinkRepository.save(any())).thenReturn(saved);

        ShareLinkResponse response = shareLinkService.createShareLink(promptId, userId, request);

        assertThat(response.getExpiresAt()).isEqualTo(expiresAt);
    }

    @Test
    void listShareLinks_ShouldReturnAllActiveLinks() {
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.of(prompt));

        ShareLink link1 = ShareLink.builder().id(UUID.randomUUID()).promptId(promptId).token("t1").createdAt(Instant.now()).build();
        ShareLink link2 = ShareLink.builder().id(UUID.randomUUID()).promptId(promptId).token("t2").createdAt(Instant.now()).build();
        when(shareLinkRepository.findAllByPromptIdAndDeletedAtIsNull(promptId))
                .thenReturn(List.of(link1, link2));

        List<ShareLinkResponse> responses = shareLinkService.listShareLinks(promptId, userId);

        assertThat(responses).hasSize(2);
    }

    @Test
    void listShareLinks_WhenPromptNotFound_ShouldThrow404() {
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.listShareLinks(promptId, userId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Prompt not found");
    }

    @Test
    void updateExpiration_ShouldUpdateExpiresAt() {
        UUID shareLinkId = UUID.randomUUID();
        Instant newExpiry = Instant.now().plus(30, ChronoUnit.DAYS);
        ShareLinkRequest request = ShareLinkRequest.builder().expiresAt(newExpiry).build();

        ShareLink shareLink = ShareLink.builder()
                .id(shareLinkId)
                .promptId(promptId)
                .token("tok")
                .createdAt(Instant.now())
                .build();

        when(shareLinkRepository.findByIdAndDeletedAtIsNull(shareLinkId)).thenReturn(Optional.of(shareLink));
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.of(prompt));
        when(shareLinkRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ShareLinkResponse response = shareLinkService.updateExpiration(shareLinkId, userId, request);

        assertThat(response.getExpiresAt()).isEqualTo(newExpiry);
    }

    @Test
    void updateExpiration_WhenShareLinkNotFound_ShouldThrow404() {
        UUID shareLinkId = UUID.randomUUID();
        when(shareLinkRepository.findByIdAndDeletedAtIsNull(shareLinkId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.updateExpiration(shareLinkId, userId, new ShareLinkRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Share link not found");
    }

    @Test
    void revokeShareLink_ShouldSetRevokedAtAndDeletedAt() {
        UUID shareLinkId = UUID.randomUUID();
        ShareLink shareLink = ShareLink.builder()
                .id(shareLinkId)
                .promptId(promptId)
                .token("tok")
                .createdAt(Instant.now())
                .build();

        when(shareLinkRepository.findByIdAndDeletedAtIsNull(shareLinkId)).thenReturn(Optional.of(shareLink));
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.of(prompt));

        shareLinkService.revokeShareLink(shareLinkId, userId);

        verify(shareLinkRepository).save(any());
        assertThat(shareLink.getRevokedAt()).isNotNull();
        assertThat(shareLink.getDeletedAt()).isNotNull();
    }

    @Test
    void revokeShareLink_WhenNotOwner_ShouldThrow403() {
        UUID shareLinkId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        ShareLink shareLink = ShareLink.builder()
                .id(shareLinkId)
                .promptId(promptId)
                .token("tok")
                .createdAt(Instant.now())
                .build();

        when(shareLinkRepository.findByIdAndDeletedAtIsNull(shareLinkId)).thenReturn(Optional.of(shareLink));
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, otherUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.revokeShareLink(shareLinkId, otherUserId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    void getPublicShare_ShouldReturnPromptContent() {
        String token = "validtoken123";
        ShareLink shareLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token(token)
                .createdAt(Instant.now())
                .build();

        when(shareLinkRepository.findByTokenAndDeletedAtIsNull(token)).thenReturn(Optional.of(shareLink));
        when(promptRepository.findById(promptId)).thenReturn(Optional.of(prompt));

        PublicShareResponse response = shareLinkService.getPublicShare(token);

        assertThat(response.getTitle()).isEqualTo("Test Prompt");
        assertThat(response.getBody()).isEqualTo("Body content");
    }

    @Test
    void getPublicShare_WhenExpired_ShouldThrow410() {
        String token = "expiredtoken";
        ShareLink shareLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token(token)
                .expiresAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();

        when(shareLinkRepository.findByTokenAndDeletedAtIsNull(token)).thenReturn(Optional.of(shareLink));

        assertThatThrownBy(() -> shareLinkService.getPublicShare(token))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void getPublicShare_WhenRevoked_ShouldThrow410() {
        String token = "revokedtoken";
        ShareLink shareLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token(token)
                .revokedAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .createdAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build();

        when(shareLinkRepository.findByTokenAndDeletedAtIsNull(token)).thenReturn(Optional.of(shareLink));

        assertThatThrownBy(() -> shareLinkService.getPublicShare(token))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    void getPublicShare_WhenTokenNotFound_ShouldThrow404() {
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("notfound")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.getPublicShare("notfound"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Share link not found");
    }

    @Test
    void emailShareLink_ShouldCreateShareLinkAndSendEmail() {
        com.mrpaulwoods.promptvault.backend.dto.EmailShareRequest request = new com.mrpaulwoods.promptvault.backend.dto.EmailShareRequest();
        request.setRecipientEmail("recipient@example.com");

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.of(prompt));
        ShareLink savedLink = ShareLink.builder()
                .id(UUID.randomUUID())
                .promptId(promptId)
                .token("abc123token")
                .createdAt(Instant.now())
                .build();
        when(shareLinkRepository.save(any())).thenReturn(savedLink);
        when(mailProperties.getFrom()).thenReturn("noreply@example.com");
        when(mailProperties.getBaseUrl()).thenReturn("http://localhost:5173");

        shareLinkService.emailShareLink(promptId, userId, request);

        verify(shareLinkRepository).save(any());
        verify(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void emailShareLink_WhenPromptNotFound_ShouldThrow404() {
        com.mrpaulwoods.promptvault.backend.dto.EmailShareRequest request = new com.mrpaulwoods.promptvault.backend.dto.EmailShareRequest();
        request.setRecipientEmail("recipient@example.com");

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.emailShareLink(promptId, userId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Prompt not found");
    }

    @Test
    void getPublicShare_WhenShareLinkSoftDeleted_ShouldThrow404() {
        // findByTokenAndDeletedAtIsNull returns empty for soft-deleted links (filtered at DB level)
        when(shareLinkRepository.findByTokenAndDeletedAtIsNull("deletedtoken")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareLinkService.getPublicShare("deletedtoken"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Share link not found");
    }
}
