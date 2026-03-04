package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.TagRequest;
import com.mrpaulwoods.promptvault.backend.dto.TagResponse;
import com.mrpaulwoods.promptvault.backend.entity.Tag;
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
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    private UUID userId;
    private TagRequest request;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        request = TagRequest.builder().name("Test Tag").comments("Test Comments").build();
    }

    @Test
    void getAllTags_ShouldReturnTags() {
        Tag tag = Tag.builder().id(UUID.randomUUID()).name("Tag 1").userId(userId).build();
        when(tagRepository.findByUserIdAndDeletedAtIsNull(userId)).thenReturn(List.of(tag));

        List<TagResponse> responses = tagService.getAllTags(userId);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getName()).isEqualTo("Tag 1");
    }

    @Test
    void createTag_ShouldSaveTag() {
        Tag savedTag = Tag.builder().id(UUID.randomUUID()).name(request.getName()).build();
        when(tagRepository.save(any(Tag.class))).thenReturn(savedTag);

        TagResponse response = tagService.createTag(userId, request);

        assertThat(response.getName()).isEqualTo(request.getName());
        verify(tagRepository).save(any(Tag.class));
    }

    @Test
    void updateTag_ShouldUpdateAndSave() {
        UUID tagId = UUID.randomUUID();
        Tag existingTag = Tag.builder().id(tagId).userId(userId).name("Old Name").build();
        Tag updatedTag = Tag.builder().id(tagId).userId(userId).name("New Name").build();

        when(tagRepository.findById(tagId)).thenReturn(Optional.of(existingTag));
        when(tagRepository.save(any(Tag.class))).thenReturn(updatedTag);

        TagResponse response = tagService.updateTag(userId, tagId, new TagRequest("New Name", null));

        assertThat(response.getName()).isEqualTo("New Name");
        verify(tagRepository).save(existingTag);
        assertThat(existingTag.getName()).isEqualTo("New Name");
    }

    @Test
    void deleteTag_ShouldDeleteRelationsAndSoftDelete() {
        UUID tagId = UUID.randomUUID();
        Tag tag = Tag.builder().id(tagId).userId(userId).build();

        when(tagRepository.findById(tagId)).thenReturn(Optional.of(tag));

        tagService.deleteTag(userId, tagId);

        verify(tagRepository).deletePromptTagRelations(tagId);
        verify(tagRepository).save(tag);
        assertThat(tag.getDeletedAt()).isNotNull();
    }

    @Test
    void deleteTag_WhenNotFound_ShouldThrow() {
        UUID tagId = UUID.randomUUID();
        when(tagRepository.findById(tagId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(userId, tagId))
                .isExactlyInstanceOf(ResponseStatusException.class);
    }
}
