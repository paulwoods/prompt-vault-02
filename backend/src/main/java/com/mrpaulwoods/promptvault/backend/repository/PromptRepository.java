package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.Prompt;
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
}
