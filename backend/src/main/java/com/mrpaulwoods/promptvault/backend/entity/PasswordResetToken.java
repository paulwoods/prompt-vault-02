package com.mrpaulwoods.promptvault.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("password_reset_token")
public class PasswordResetToken {

    @Id
    private UUID id;

    private UUID userId;

    private String token;

    private Instant expiresAt;

    private Instant usedAt;

    private Instant deletedAt;

    @Version
    private Integer rowVersion;

    @CreatedDate
    private Instant createdAt;
}
