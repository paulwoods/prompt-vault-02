package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.PromptRequest;
import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import com.mrpaulwoods.promptvault.backend.entity.PromptVersion;
import com.mrpaulwoods.promptvault.backend.repository.PromptRepository;
import com.mrpaulwoods.promptvault.backend.repository.PromptVersionRepository;
import com.mrpaulwoods.promptvault.backend.repository.TagRepository;
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
class PromptServiceTest {

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private PromptVersionRepository promptVersionRepository;

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private PromptService promptService;

    private UUID userId;
    private PromptRequest request;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        request = PromptRequest.builder()
                .title("Test Title")
                .currentBody("Test Body")
                .isFavorite(false)
                .build();
    }

    @Test
    void createPrompt_ShouldSavePromptAndInitialVersion() {
        Prompt savedPrompt = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title(request.getTitle())
                .currentBody(request.getCurrentBody())
                .build();

        when(promptRepository.save(any(Prompt.class))).thenReturn(savedPrompt);
        when(tagRepository.findTagsByPromptId(savedPrompt.getId())).thenReturn(List.of());

        PromptResponse response = promptService.createPrompt(userId, request);

        assertThat(response.getTitle()).isEqualTo(request.getTitle());
        verify(promptRepository).save(any(Prompt.class));
        verify(promptVersionRepository).save(any(PromptVersion.class));
    }

    @Test
    void updatePrompt_WhenBodyChanges_ShouldCreateNewVersion() {
        UUID promptId = UUID.randomUUID();
        Prompt existingPrompt = Prompt.builder()
                .id(promptId)
                .userId(userId)
                .title("Old Title")
                .currentBody("Old Body")
                .rowVersion(1)
                .build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.of(existingPrompt));
        when(promptRepository.save(any(Prompt.class))).thenReturn(existingPrompt);
        when(promptVersionRepository.findFirstByPromptIdOrderByVersionNumberDesc(promptId))
                .thenReturn(PromptVersion.builder().versionNumber(1).build());
        when(tagRepository.findTagsByPromptId(promptId)).thenReturn(List.of());

        PromptRequest updateRequest = PromptRequest.builder()
                .title("New Title")
                .currentBody("New Body")
                .build();

        promptService.updatePrompt(promptId, userId, updateRequest, 1);

        verify(promptVersionRepository).save(any(PromptVersion.class));
        verify(promptVersionRepository).countByPromptId(promptId);
    }

    @Test
    void updatePrompt_WithWrongVersion_ShouldThrowConflict() {
        UUID promptId = UUID.randomUUID();
        Prompt existingPrompt = Prompt.builder()
                .id(promptId)
                .userId(userId)
                .rowVersion(1)
                .build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.of(existingPrompt));

        assertThatThrownBy(() -> promptService.updatePrompt(promptId, userId, request, 2))
                .isExactlyInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("modified");
    }

    @Test
    void enforceVersionCap_ShouldDeleteOldestWhenExceeding50() {
        // This is a private method, but it's called during updatePrompt when body changes
        UUID promptId = UUID.randomUUID();
        Prompt existingPrompt = Prompt.builder()
                .id(promptId)
                .userId(userId)
                .currentBody("Old Body")
                .rowVersion(1)
                .build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId))
                .thenReturn(Optional.of(existingPrompt));
        when(promptRepository.save(any(Prompt.class))).thenReturn(existingPrompt);
        when(promptVersionRepository.countByPromptId(promptId)).thenReturn(51L).thenReturn(50L);
        when(tagRepository.findTagsByPromptId(promptId)).thenReturn(List.of());

        promptService.updatePrompt(promptId, userId, request, 1);

        verify(promptVersionRepository).deleteFirstByPromptIdOrderByVersionNumberAsc(promptId);
    }

    @Test
    void searchPrompts_WithQuery_ShouldReturnMatchingPrompts() {
        Prompt matchingPrompt = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title("Test search title")
                .currentBody("body")
                .build();

        when(promptRepository.searchByText(userId, "search")).thenReturn(List.of(matchingPrompt));
        when(tagRepository.findTagsByPromptId(matchingPrompt.getId())).thenReturn(List.of());

        List<PromptResponse> results = promptService.searchPrompts(userId, "search");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Test search title");
        verify(promptRepository).searchByText(userId, "search");
    }

    @Test
    void searchPrompts_WithBlankQuery_ShouldReturnAllPrompts() {
        Prompt prompt = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title("Any Prompt")
                .currentBody("body")
                .build();

        when(promptRepository.findAllByUserIdAndDeletedAtIsNull(userId)).thenReturn(List.of(prompt));
        when(tagRepository.findTagsByPromptId(prompt.getId())).thenReturn(List.of());

        List<PromptResponse> results = promptService.searchPrompts(userId, "  ");

        assertThat(results).hasSize(1);
        verify(promptRepository).findAllByUserIdAndDeletedAtIsNull(userId);
    }

    @Test
    void filterPrompts_ByFolderAndFavorite_ShouldCallFindByFilters() {
        UUID folderId = UUID.randomUUID();
        Prompt prompt = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .folderId(folderId)
                .isFavorite(true)
                .title("Fav Prompt")
                .currentBody("body")
                .build();

        when(promptRepository.findByFilters(userId, folderId, true)).thenReturn(List.of(prompt));
        when(tagRepository.findTagsByPromptId(prompt.getId())).thenReturn(List.of());

        List<PromptResponse> results = promptService.filterPrompts(userId, folderId, null, true);

        assertThat(results).hasSize(1);
        verify(promptRepository).findByFilters(userId, folderId, true);
    }

    @Test
    void filterPrompts_ByTag_ShouldCallFindByTagIdAndFilters() {
        UUID tagId = UUID.randomUUID();
        Prompt prompt = Prompt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title("Tagged Prompt")
                .currentBody("body")
                .build();

        when(promptRepository.findByTagIdAndFilters(userId, tagId, null, null)).thenReturn(List.of(prompt));
        when(tagRepository.findTagsByPromptId(prompt.getId())).thenReturn(List.of());

        List<PromptResponse> results = promptService.filterPrompts(userId, null, tagId, null);

        assertThat(results).hasSize(1);
        verify(promptRepository).findByTagIdAndFilters(userId, tagId, null, null);
    }

    @Test
    void getVersions_ShouldReturnVersionsInOrder() {
        UUID promptId = UUID.randomUUID();
        Prompt prompt = Prompt.builder().id(promptId).userId(userId).build();

        PromptVersion v1 = PromptVersion.builder().id(UUID.randomUUID()).promptId(promptId).versionNumber(1).bodySnapshot("v1").build();
        PromptVersion v2 = PromptVersion.builder().id(UUID.randomUUID()).promptId(promptId).versionNumber(2).bodySnapshot("v2").build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.of(prompt));
        when(promptVersionRepository.findAllByPromptIdOrderByVersionNumberAsc(promptId)).thenReturn(List.of(v1, v2));

        List<com.mrpaulwoods.promptvault.backend.dto.PromptVersionResponse> versions = promptService.getVersions(promptId, userId);

        assertThat(versions).hasSize(2);
        assertThat(versions.get(0).getVersionNumber()).isEqualTo(1);
        assertThat(versions.get(1).getVersionNumber()).isEqualTo(2);
    }

    @Test
    void getVersions_WhenPromptNotFound_ShouldThrow404() {
        UUID promptId = UUID.randomUUID();
        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> promptService.getVersions(promptId, userId))
                .isExactlyInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Prompt not found");
    }

    @Test
    void restoreVersion_ShouldSetBodyAndCreateNewVersion() {
        UUID promptId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();

        Prompt prompt = Prompt.builder().id(promptId).userId(userId).currentBody("current").rowVersion(1).build();
        PromptVersion version = PromptVersion.builder().id(versionId).promptId(promptId).versionNumber(1).bodySnapshot("restored body").build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.of(prompt));
        when(promptVersionRepository.findById(versionId)).thenReturn(Optional.of(version));
        when(promptRepository.save(any(Prompt.class))).thenReturn(prompt);
        when(promptVersionRepository.findFirstByPromptIdOrderByVersionNumberDesc(promptId)).thenReturn(version);
        when(tagRepository.findTagsByPromptId(promptId)).thenReturn(List.of());

        promptService.restoreVersion(promptId, versionId, userId);

        verify(promptRepository).save(any(Prompt.class));
        verify(promptVersionRepository).save(any(PromptVersion.class));
    }

    @Test
    void restoreVersion_WhenVersionBelongsToDifferentPrompt_ShouldThrow403() {
        UUID promptId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        UUID otherPromptId = UUID.randomUUID();

        Prompt prompt = Prompt.builder().id(promptId).userId(userId).build();
        PromptVersion version = PromptVersion.builder().id(versionId).promptId(otherPromptId).build();

        when(promptRepository.findByIdAndUserIdAndDeletedAtIsNull(promptId, userId)).thenReturn(Optional.of(prompt));
        when(promptVersionRepository.findById(versionId)).thenReturn(Optional.of(version));

        assertThatThrownBy(() -> promptService.restoreVersion(promptId, versionId, userId))
                .isExactlyInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("does not belong");
    }
}
