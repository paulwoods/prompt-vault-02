package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.entity.PromptVersion;
import com.mrpaulwoods.promptvault.backend.entity.Tag;
import com.mrpaulwoods.promptvault.backend.repository.PromptRepository;
import com.mrpaulwoods.promptvault.backend.repository.PromptVersionRepository;
import com.mrpaulwoods.promptvault.backend.repository.TagRepository;
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
public class PromptService {

    private static final int MAX_VERSIONS = 50;
    private final PromptRepository promptRepository;
    private final PromptVersionRepository promptVersionRepository;
    private final TagRepository tagRepository;

    @Transactional
    public PromptResponse createPrompt(UUID userId, PromptRequest request) {
        Prompt prompt = Prompt.builder()
                .userId(userId)
                .folderId(request.getFolderId())
                .title(request.getTitle())
                .currentBody(request.getCurrentBody())
                .isFavorite(request.getIsFavorite() != null && request.getIsFavorite())
                .comments(request.getComments())
                .build();

        Prompt savedPrompt = promptRepository.save(prompt);

        if (request.getTagIds() != null) {
            for (UUID tagId : request.getTagIds()) {
                tagRepository.assignTagToPrompt(savedPrompt.getId(), tagId);
            }
        }

        createVersion(savedPrompt.getId(), savedPrompt.getCurrentBody(), 1);

        return mapToResponse(savedPrompt);
    }

    public List<PromptResponse> getAllPrompts(UUID userId) {
        return promptRepository.findAllByUserIdAndDeletedAtIsNull(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PromptResponse getPrompt(UUID id, UUID userId) {
        Prompt prompt = promptRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found"));
        return mapToResponse(prompt);
    }

    @Transactional
    public PromptResponse updatePrompt(UUID id, UUID userId, PromptRequest request, Integer rowVersion) {
        Prompt prompt = promptRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found"));

        if (!prompt.getRowVersion().equals(rowVersion)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Prompt has been modified by another user");
        }

        boolean bodyChanged = !prompt.getCurrentBody().equals(request.getCurrentBody());

        prompt.setTitle(request.getTitle());
        prompt.setCurrentBody(request.getCurrentBody());
        prompt.setFolderId(request.getFolderId());
        prompt.setFavorite(request.getIsFavorite() != null && request.getIsFavorite());
        prompt.setComments(request.getComments());

        Prompt updatedPrompt = promptRepository.save(prompt);

        tagRepository.removeAllTagsFromPrompt(id);
        if (request.getTagIds() != null) {
            for (UUID tagId : request.getTagIds()) {
                tagRepository.assignTagToPrompt(id, tagId);
            }
        }

        if (bodyChanged) {
            PromptVersion lastVersion = promptVersionRepository.findFirstByPromptIdOrderByVersionNumberDesc(id);
            int nextVersionNumber = (lastVersion != null) ? lastVersion.getVersionNumber() + 1 : 1;

            createVersion(id, updatedPrompt.getCurrentBody(), nextVersionNumber);
            enforceVersionCap(id);
        }

        return mapToResponse(updatedPrompt);
    }

    @Transactional
    public void deletePrompt(UUID id, UUID userId) {
        Prompt prompt = promptRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prompt not found"));
        prompt.setDeletedAt(Instant.now());
        promptRepository.save(prompt);
    }

    private void createVersion(UUID promptId, String body, int versionNumber) {
        PromptVersion version = PromptVersion.builder()
                .promptId(promptId)
                .bodySnapshot(body)
                .versionNumber(versionNumber)
                .build();
        promptVersionRepository.save(version);
    }

    private void enforceVersionCap(UUID promptId) {
        long count = promptVersionRepository.countByPromptId(promptId);
        while (count > MAX_VERSIONS) {
            promptVersionRepository.deleteFirstByPromptIdOrderByVersionNumberAsc(promptId);
            count--;
        }
    }

    private PromptResponse mapToResponse(Prompt prompt) {
        List<UUID> tagIds = tagRepository.findTagsByPromptId(prompt.getId()).stream()
                .map(Tag::getId)
                .collect(Collectors.toList());

        return PromptResponse.builder()
                .id(prompt.getId())
                .userId(prompt.getUserId())
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
