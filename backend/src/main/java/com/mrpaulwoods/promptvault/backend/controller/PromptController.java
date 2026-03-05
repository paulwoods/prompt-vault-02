package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.dto.PromptVersionResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.PromptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
public class PromptController {

    private final PromptService promptService;

    @PostMapping
    public ResponseEntity<PromptResponse> createPrompt(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PromptRequest request) {
        return ResponseEntity.ok(promptService.createPrompt(user.getId(), request));
    }

    @GetMapping("/search")
    public ResponseEntity<List<PromptResponse>> searchPrompts(
            @AuthenticationPrincipal User user,
            @RequestParam String q) {
        return ResponseEntity.ok(promptService.searchPrompts(user.getId(), q));
    }

    @GetMapping("/filter")
    public ResponseEntity<List<PromptResponse>> filterPrompts(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID folderId,
            @RequestParam(required = false) UUID tagId,
            @RequestParam(required = false) Boolean favorite) {
        return ResponseEntity.ok(promptService.filterPrompts(user.getId(), folderId, tagId, favorite));
    }

    @GetMapping
    public ResponseEntity<List<PromptResponse>> getAllPrompts(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(promptService.getAllPrompts(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromptResponse> getPrompt(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(promptService.getPrompt(id, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromptResponse> updatePrompt(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody PromptRequest request,
            @RequestParam Integer rowVersion) {
        return ResponseEntity.ok(promptService.updatePrompt(id, user.getId(), request, rowVersion));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<PromptVersionResponse>> getVersions(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(promptService.getVersions(id, user.getId()));
    }

    @PostMapping("/{id}/versions/{versionId}/restore")
    public ResponseEntity<PromptResponse> restoreVersion(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @PathVariable UUID versionId) {
        return ResponseEntity.ok(promptService.restoreVersion(id, versionId, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrompt(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        promptService.deletePrompt(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
