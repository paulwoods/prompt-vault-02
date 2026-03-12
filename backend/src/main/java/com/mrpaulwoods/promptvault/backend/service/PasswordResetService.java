package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.config.MailProperties;
import com.mrpaulwoods.promptvault.backend.entity.PasswordResetToken;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.repository.PasswordResetTokenRepository;
import com.mrpaulwoods.promptvault.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    @Transactional
    public void requestReset(String email) {
        log.info("Password reset requested email={}", email);
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .userId(user.getId())
                    .token(token)
                    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                    .build();
            passwordResetTokenRepository.save(resetToken);
            sendResetEmail(user, token);
        });
        // Always return silently to prevent user enumeration
    }

    @Transactional
    public void confirmReset(String token, String newPassword) {
        log.info("Password reset confirm attempt");
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndDeletedAtIsNull(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));

        if (resetToken.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token has expired");
        }

        User user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(Instant.now());
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);
        log.info("Password reset completed userId={}", user.getId());
    }

    private void sendResetEmail(User user, String token) {
        String resetUrl = mailProperties.getBaseUrl() + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailProperties.getFrom());
        message.setTo(user.getEmail());
        message.setSubject("Reset your Prompt Vault password");
        message.setText("Click the link below to reset your password. This link expires in 1 hour.\n\n" + resetUrl
                        + "\n\nIf you did not request a password reset, you can safely ignore this email.");
        mailSender.send(message);
    }
}
