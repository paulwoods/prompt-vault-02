package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.PublicShareResponse;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkRequest;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkResponse;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.entity.ShareLink;
import com.mrpaulwoods.promptvault.backend.repository.PromptRepository;
import com.mrpaulwoods.promptvault.backend.repository.ShareLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShareLinkService {

    private final ShareLinkRepository shareLinkRepository;
    private final PromptRepository promptRepository;

    @Transactional
    public ShareLinkResponse createShareLink(UUID promptId, UUID userId, ShareLinkRequest request) {
        promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found"));

        ShareLink shareLink = ShareLink.builder()
                .promptId(promptId)
                .token(UUID.randomUUID().toString().replace("-", ""))
                .expiresAt(request != null ? request.getExpiresAt() : null)
                .build();

        ShareLink saved = shareLinkRepository.save(shareLink);
        return mapToResponse(saved);
    }

    public List<ShareLinkResponse> listShareLinks(UUID promptId, UUID userId) {
        promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found"));

        return shareLinkRepository.findAllByPromptIdAndDeletedAtIsNull(promptId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ShareLinkResponse updateExpiration(UUID shareLinkId, UUID userId, ShareLinkRequest request) {
        ShareLink shareLink = shareLinkRepository.findByIdAndDeletedAtIsNull(shareLinkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link not found"));

        promptRepository.findByIdAndUserIdAndDeletedAtIsNull(shareLink.getPromptId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        shareLink.setExpiresAt(request.getExpiresAt());
        ShareLink saved = shareLinkRepository.save(shareLink);
        return mapToResponse(saved);
    }

    @Transactional
    public void revokeShareLink(UUID shareLinkId, UUID userId) {
        ShareLink shareLink = shareLinkRepository.findByIdAndDeletedAtIsNull(shareLinkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link not found"));

        promptRepository.findByIdAndUserIdAndDeletedAtIsNull(shareLink.getPromptId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied"));

        shareLink.setRevokedAt(Instant.now());
        shareLink.setDeletedAt(Instant.now());
        shareLinkRepository.save(shareLink);
    }

    public PublicShareResponse getPublicShare(String token) {
        ShareLink shareLink = shareLinkRepository.findByTokenAndDeletedAtIsNull(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link not found"));

        if (shareLink.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Share link has been revoked");
        }

        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Share link has expired");
        }

        Prompt prompt = promptRepository.findById(shareLink.getPromptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found"));

        if (prompt.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found");
        }

        return PublicShareResponse.builder()
                .promptId(prompt.getId())
                .title(prompt.getTitle())
                .body(prompt.getCurrentBody())
                .sharedAt(shareLink.getCreatedAt())
                .build();
    }

    private ShareLinkResponse mapToResponse(ShareLink shareLink) {
        boolean active = shareLink.getRevokedAt() == null
                         && (shareLink.getExpiresAt() == null || shareLink.getExpiresAt().isAfter(Instant.now()));

        return ShareLinkResponse.builder()
                .id(shareLink.getId())
                .promptId(shareLink.getPromptId())
                .token(shareLink.getToken())
                .expiresAt(shareLink.getExpiresAt())
                .revokedAt(shareLink.getRevokedAt())
                .createdAt(shareLink.getCreatedAt())
                .active(active)
                .build();
    }
}
