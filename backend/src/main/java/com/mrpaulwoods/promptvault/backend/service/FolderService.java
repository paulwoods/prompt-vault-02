package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.FolderRequest;
import com.mrpaulwoods.promptvault.backend.dto.FolderResponse;
import com.mrpaulwoods.promptvault.backend.entity.Folder;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.repository.FolderRepository;
import com.mrpaulwoods.promptvault.backend.repository.PromptRepository;
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
public class FolderService {

    private final FolderRepository folderRepository;
    private final PromptRepository promptRepository;

    public List<FolderResponse> getAllFolders(UUID userId) {
        return folderRepository.findAllByUserIdAndDeletedAtIsNull(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FolderResponse createFolder(UUID userId, FolderRequest request) {
        folderRepository.findActiveByUserIdAndName(userId, request.getName())
                .ifPresent(f -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Folder with this name already exists");
                });

        Folder folder = Folder.builder()
                .userId(userId)
                .name(request.getName())
                .build();

        Folder savedFolder = folderRepository.save(folder);
        return mapToResponse(savedFolder);
    }

    @Transactional
    public FolderResponse renameFolder(UUID id, UUID userId, FolderRequest request) {
        Folder folder = folderRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        if (!folder.getName().equals(request.getName())) {
            folderRepository.findActiveByUserIdAndName(userId, request.getName())
                    .ifPresent(f -> {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Folder with this name already exists");
                    });
            folder.setName(request.getName());
            folder = folderRepository.save(folder);
        }

        return mapToResponse(folder);
    }

    @Transactional
    public void deleteFolder(UUID id, UUID userId, String mode, UUID targetFolderId) {
        Folder folder = folderRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        List<Prompt> prompts = promptRepository.findAllByFolderIdAndDeletedAtIsNull(id);

        if ("move".equals(mode)) {
            if (targetFolderId == null) {
                // Move to root
                prompts.forEach(p -> p.setFolderId(null));
            } else {
                // Verify target folder exists and belongs to user
                folderRepository.findByIdAndUserIdAndDeletedAtIsNull(targetFolderId, userId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target folder not found"));
                prompts.forEach(p -> p.setFolderId(targetFolderId));
            }
            promptRepository.saveAll(prompts);
        } else if ("delete".equals(mode)) {
            Instant now = Instant.now();
            prompts.forEach(p -> p.setDeletedAt(now));
            promptRepository.saveAll(prompts);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid delete mode");
        }

        folder.setDeletedAt(Instant.now());
        folderRepository.save(folder);
    }

    private FolderResponse mapToResponse(Folder folder) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .build();
    }
}
