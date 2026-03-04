package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.TagRequest;
import com.mrpaulwoods.promptvault.backend.dto.TagResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getAllTags(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.getAllTags(user.getId()));
    }

    @PostMapping
    public ResponseEntity<TagResponse> createTag(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(tagService.createTag(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagResponse> updateTag(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody TagRequest request) {
        return ResponseEntity.ok(tagService.updateTag(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        tagService.deleteTag(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
