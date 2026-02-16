package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.Folder;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FolderRepository extends ListCrudRepository<Folder, UUID> {
    List<Folder> findAllByUserIdAndDeletedAtIsNull(UUID userId);

    Optional<Folder> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    Optional<Folder> findByUserIdAndNameAndDeletedAtIsNull(UUID userId, String name);

    @Query("SELECT * FROM folder WHERE user_id = :userId AND name = :name AND deleted_at IS NULL")
    Optional<Folder> findActiveByUserIdAndName(UUID userId, String name);
}
