package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.FolderRequest;
import com.mrpaulwoods.promptvault.backend.dto.FolderResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @GetMapping
    public ResponseEntity<List<FolderResponse>> getAllFolders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(folderService.getAllFolders(user.getId()));
    }

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody FolderRequest request) {
        return ResponseEntity.ok(folderService.createFolder(user.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FolderResponse> renameFolder(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody FolderRequest request) {
        return ResponseEntity.ok(folderService.renameFolder(id, user.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestParam String mode,
            @RequestParam(required = false) UUID targetFolderId) {
        folderService.deleteFolder(id, user.getId(), mode, targetFolderId);
        return ResponseEntity.noContent().build();
    }
}
