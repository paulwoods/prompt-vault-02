package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.config.MailProperties;
import com.mrpaulwoods.promptvault.backend.entity.PasswordResetToken;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.repository.PasswordResetTokenRepository;
import com.mrpaulwoods.promptvault.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JavaMailSender mailSender;
    @Mock
    private MailProperties mailProperties;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .email("user@example.com")
                .passwordHash("oldhash")
                .build();
    }

    @Test
    void requestReset_WhenUserExists_ShouldSaveTokenAndSendEmail() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mailProperties.getFrom()).thenReturn("noreply@example.com");
        when(mailProperties.getBaseUrl()).thenReturn("http://localhost:5173");

        passwordResetService.requestReset("user@example.com");

        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void requestReset_WhenUserNotFound_ShouldNotSendEmailOrThrow() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestReset("unknown@example.com");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void requestReset_ShouldSendEmailWithResetLink() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mailProperties.getFrom()).thenReturn("noreply@example.com");
        when(mailProperties.getBaseUrl()).thenReturn("http://localhost:5173");

        passwordResetService.requestReset("user@example.com");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();

        assertThat(sent.getTo()).contains("user@example.com");
        assertThat(sent.getFrom()).isEqualTo("noreply@example.com");
        assertThat(sent.getText()).contains("http://localhost:5173/reset-password?token=");
    }

    @Test
    void confirmReset_WithValidToken_ShouldUpdatePasswordAndMarkTokenUsed() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("validtoken")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .rowVersion(0)
                .build();

        when(passwordResetTokenRepository.findByTokenAndDeletedAtIsNull("validtoken")).thenReturn(Optional.of(token));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpassword")).thenReturn("newhash");
        when(userRepository.save(any())).thenReturn(user);
        when(passwordResetTokenRepository.save(any())).thenReturn(token);

        passwordResetService.confirmReset("validtoken", "newpassword");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo("newhash");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());
        assertThat(tokenCaptor.getValue().getUsedAt()).isNotNull();
    }

    @Test
    void confirmReset_ShouldSetPasswordChangedAt() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("validtoken")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .rowVersion(0)
                .build();

        when(passwordResetTokenRepository.findByTokenAndDeletedAtIsNull("validtoken")).thenReturn(Optional.of(token));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpassword")).thenReturn("newhash");
        when(userRepository.save(any())).thenReturn(user);
        when(passwordResetTokenRepository.save(any())).thenReturn(token);

        Instant before = Instant.now();
        passwordResetService.confirmReset("validtoken", "newpassword");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getPasswordChangedAt())
                .isNotNull()
                .isAfterOrEqualTo(before);
    }

    @Test
    void confirmReset_WithInvalidToken_ShouldThrow400() {
        when(passwordResetTokenRepository.findByTokenAndDeletedAtIsNull("badtoken")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.confirmReset("badtoken", "newpassword"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid or expired reset token");
    }

    @Test
    void confirmReset_WithAlreadyUsedToken_ShouldThrow400() {
        PasswordResetToken usedToken = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("usedtoken")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .usedAt(Instant.now().minus(10, ChronoUnit.MINUTES))
                .rowVersion(0)
                .build();

        when(passwordResetTokenRepository.findByTokenAndDeletedAtIsNull("usedtoken")).thenReturn(Optional.of(usedToken));

        assertThatThrownBy(() -> passwordResetService.confirmReset("usedtoken", "newpassword"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void confirmReset_WithExpiredToken_ShouldThrow400() {
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .token("expiredtoken")
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .rowVersion(0)
                .build();

        when(passwordResetTokenRepository.findByTokenAndDeletedAtIsNull("expiredtoken")).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> passwordResetService.confirmReset("expiredtoken", "newpassword"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("expired");
    }
}
