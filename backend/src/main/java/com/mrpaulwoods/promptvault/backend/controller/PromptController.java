package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrompt(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        promptService.deletePrompt(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
