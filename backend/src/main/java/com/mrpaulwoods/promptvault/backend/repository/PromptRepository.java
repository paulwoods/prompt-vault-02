package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.Prompt;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromptRepository extends ListCrudRepository<Prompt, UUID> {

    List<Prompt> findAllByUserIdAndDeletedAtIsNull(UUID userId);

    Optional<Prompt> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<Prompt> findAllByFolderIdAndDeletedAtIsNull(UUID folderId);

    @Query("""
            SELECT p.* FROM prompt p
            WHERE p.user_id = :userId
              AND p.deleted_at IS NULL
              AND to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.current_body, ''))
                  @@ plainto_tsquery('english', :query)
            ORDER BY ts_rank(
                to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.current_body, '')),
                plainto_tsquery('english', :query)
            ) DESC
            """)
    List<Prompt> searchByText(UUID userId, String query);

    @Query("""
            SELECT p.* FROM prompt p
            WHERE p.user_id = :userId
              AND p.deleted_at IS NULL
              AND (:folderId IS NULL OR p.folder_id = :folderId)
              AND (:favorite IS NULL OR p.is_favorite = :favorite)
            """)
    List<Prompt> findByFilters(UUID userId, UUID folderId, Boolean favorite);

    @Query("""
            SELECT DISTINCT p.* FROM prompt p
            JOIN prompt_tag pt ON pt.prompt_id = p.id
            WHERE p.user_id = :userId
              AND p.deleted_at IS NULL
              AND pt.tag_id = :tagId
              AND (:folderId IS NULL OR p.folder_id = :folderId)
              AND (:favorite IS NULL OR p.is_favorite = :favorite)
            """)
    List<Prompt> findByTagIdAndFilters(UUID userId, UUID tagId, UUID folderId, Boolean favorite);
}
