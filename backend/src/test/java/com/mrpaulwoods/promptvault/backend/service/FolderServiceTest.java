package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.FolderRequest;
import com.mrpaulwoods.promptvault.backend.dto.FolderResponse;
import com.mrpaulwoods.promptvault.backend.entity.Folder;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.repository.FolderRepository;
import com.mrpaulwoods.promptvault.backend.repository.PromptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FolderServiceTest {

    @Mock
    private FolderRepository folderRepository;

    @Mock
    private PromptRepository promptRepository;

    @InjectMocks
    private FolderService folderService;

    private UUID userId;
    private FolderRequest request;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        request = FolderRequest.builder().name("Test Folder").build();
    }

    @Test
    void getAllFolders_ShouldReturnFolders() {
        Folder folder = Folder.builder().id(UUID.randomUUID()).name("Folder 1").build();
        when(folderRepository.findAllByUserIdAndDeletedAtIsNull(userId)).thenReturn(List.of(folder));

        List<FolderResponse> responses = folderService.getAllFolders(userId);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getName()).isEqualTo("Folder 1");
    }

    @Test
    void createFolder_WhenNameExists_ShouldThrowConflict() {
        when(folderRepository.findActiveByUserIdAndName(userId, request.getName()))
                .thenReturn(Optional.of(new Folder()));

        assertThatThrownBy(() -> folderService.createFolder(userId, request))
                .isExactlyInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void createFolder_ShouldSaveFolder() {
        Folder savedFolder = Folder.builder().id(UUID.randomUUID()).name(request.getName()).build();
        when(folderRepository.findActiveByUserIdAndName(userId, request.getName())).thenReturn(Optional.empty());
        when(folderRepository.save(any(Folder.class))).thenReturn(savedFolder);

        FolderResponse response = folderService.createFolder(userId, request);

        assertThat(response.getName()).isEqualTo(request.getName());
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void deleteFolder_ModeMoveToRoot_ShouldNullifyFolderId() {
        UUID folderId = UUID.randomUUID();
        Folder folder = Folder.builder().id(folderId).userId(userId).build();
        Prompt prompt = Prompt.builder().id(UUID.randomUUID()).folderId(folderId).build();

        when(folderRepository.findByIdAndUserIdAndDeletedAtIsNull(folderId, userId)).thenReturn(Optional.of(folder));
        when(promptRepository.findAllByFolderIdAndDeletedAtIsNull(folderId)).thenReturn(List.of(prompt));

        folderService.deleteFolder(folderId, userId, "move", null);

        assertThat(prompt.getFolderId()).isNull();
        verify(promptRepository).saveAll(any());
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void deleteFolder_ModeDelete_ShouldSoftDeletePrompts() {
        UUID folderId = UUID.randomUUID();
        Folder folder = Folder.builder().id(folderId).userId(userId).build();
        Prompt prompt = Prompt.builder().id(UUID.randomUUID()).folderId(folderId).build();

        when(folderRepository.findByIdAndUserIdAndDeletedAtIsNull(folderId, userId)).thenReturn(Optional.of(folder));
        when(promptRepository.findAllByFolderIdAndDeletedAtIsNull(folderId)).thenReturn(List.of(prompt));

        folderService.deleteFolder(folderId, userId, "delete", null);

        assertThat(prompt.getDeletedAt()).isNotNull();
        verify(promptRepository).saveAll(any());
        verify(folderRepository).save(any(Folder.class));
    }
}
