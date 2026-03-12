package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.entity.ShareLink;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForkService {

    private final ShareLinkRepository shareLinkRepository;
    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;

    @Transactional
    public PromptResponse forkFromShareToken(String token, UUID forkingUserId) {
        log.info("Fork requested forkingUserId={}", forkingUserId);
        // PV-112: validate share link
        ShareLink shareLink = shareLinkRepository.findByTokenAndDeletedAtIsNull(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Share link not found or has been revoked"));

        if (shareLink.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Share link has been revoked");
        }

        if (shareLink.getExpiresAt() != null && shareLink.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Share link has expired");
        }

        // PV-112: handle deleted/unavailable original prompt
        Prompt original = promptRepository.findById(shareLink.getPromptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Original prompt is no longer available"));

        if (original.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Original prompt is no longer available");
        }

        // Resolve the original author's email for attribution
        String authorEmail = userRepository.findById(original.getUserId())
                .map(User::getEmail)
                .orElse("unknown");

        // PV-110: copy content, set attribution permanently
        Prompt forked = Prompt.builder()
                .userId(forkingUserId)
                .title(original.getTitle())
                .currentBody(original.getCurrentBody())
                .isFavorite(false)
                .forkedFromPromptId(original.getId())
                .forkedFromAuthor(authorEmail)
                .build();

        Prompt saved = promptRepository.save(forked);
        log.info("Prompt forked forkedPromptId={} originalPromptId={} forkingUserId={}", saved.getId(), original.getId(), forkingUserId);

        // Create initial version for the fork
        var version = com.mrpaulwoods.promptvault.backend.entity.PromptVersion.builder()
                .promptId(saved.getId())
                .bodySnapshot(saved.getCurrentBody())
                .versionNumber(1)
                .build();
        promptVersionRepository.save(version);

        return mapToResponse(saved);
    }

    private PromptResponse mapToResponse(Prompt prompt) {
        List<UUID> tagIds = tagRepository.findTagsByPromptId(prompt.getId()).stream()
                .map(com.mrpaulwoods.promptvault.backend.entity.Tag::getId)
                .collect(Collectors.toList());

        return PromptResponse.builder()
                .id(prompt.getId())
                .folderId(prompt.getFolderId())
                .title(prompt.getTitle())
                .currentBody(prompt.getCurrentBody())
                .isFavorite(prompt.isFavorite())
                .comments(prompt.getComments())
                .forkedFromPromptId(prompt.getForkedFromPromptId())
                .forkedFromAuthor(prompt.getForkedFromAuthor())
                .rowVersion(prompt.getRowVersion())
                .createdAt(prompt.getCreatedAt())
                .updatedAt(prompt.getUpdatedAt())
                .tagIds(tagIds)
                .build();
    }
}
