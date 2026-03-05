package com.mrpaulwoods.promptvault.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLinkResponse {

    private UUID id;
    private UUID promptId;
    private String token;
    private Instant expiresAt;
    private Instant revokedAt;
    private Instant createdAt;
    private boolean active;
}
