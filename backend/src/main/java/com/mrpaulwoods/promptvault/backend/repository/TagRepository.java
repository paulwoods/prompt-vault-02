package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.Tag;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TagRepository extends ListCrudRepository<Tag, UUID> {
    List<Tag> findByUserIdAndDeletedAtIsNull(UUID userId);

    @Modifying
    @Query("DELETE FROM prompt_tag WHERE tag_id = :tagId")
    void deletePromptTagRelations(UUID tagId);

    @Modifying
    @Query("INSERT INTO prompt_tag (prompt_id, tag_id) VALUES (:promptId, :tagId)")
    void assignTagToPrompt(UUID promptId, UUID tagId);

    @Modifying
    @Query("DELETE FROM prompt_tag WHERE prompt_id = :promptId")
    void removeAllTagsFromPrompt(UUID promptId);

    @Query("SELECT t.* FROM tag t JOIN prompt_tag pt ON t.id = pt.tag_id WHERE pt.prompt_id = :promptId")
    List<Tag> findTagsByPromptId(UUID promptId);
}
