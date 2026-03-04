package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.TagRequest;
import com.mrpaulwoods.promptvault.backend.dto.TagResponse;
import com.mrpaulwoods.promptvault.backend.entity.Tag;
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
public class TagService {
    private final TagRepository tagRepository;

    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags(UUID userId) {
        return tagRepository.findByUserIdAndDeletedAtIsNull(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TagResponse createTag(UUID userId, TagRequest request) {
        Tag tag = Tag.builder()
                .userId(userId)
                .name(request.getName())
                .comments(request.getComments())
                .build();
        return mapToResponse(tagRepository.save(tag));
    }

    @Transactional
    public TagResponse updateTag(UUID userId, UUID tagId, TagRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .filter(t -> t.getUserId().equals(userId) && t.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag not found"));

        tag.setName(request.getName());
        tag.setComments(request.getComments());
        return mapToResponse(tagRepository.save(tag));
    }

    @Transactional
    public void deleteTag(UUID userId, UUID tagId) {
        Tag tag = tagRepository.findById(tagId)
                .filter(t -> t.getUserId().equals(userId) && t.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag not found"));

        // PV-51: Tag delete removes prompt_tag relations
        tagRepository.deletePromptTagRelations(tagId);

        // Soft delete tag
        tag.setDeletedAt(Instant.now());
        tagRepository.save(tag);
    }

    @Transactional(readOnly = true)
    public List<TagResponse> getTagsForPrompt(UUID promptId) {
        return tagRepository.findTagsByPromptId(promptId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TagResponse mapToResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .comments(tag.getComments())
                .createdAt(tag.getCreatedAt())
                .updatedAt(tag.getUpdatedAt())
                .build();
    }
}
