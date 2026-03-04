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
}
