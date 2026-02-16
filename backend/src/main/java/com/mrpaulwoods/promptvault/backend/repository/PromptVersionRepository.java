package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.PromptVersion;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PromptVersionRepository extends ListCrudRepository<PromptVersion, UUID> {

    List<PromptVersion> findAllByPromptIdOrderByVersionNumberAsc(UUID promptId);

    long countByPromptId(UUID promptId);

    void deleteFirstByPromptIdOrderByVersionNumberAsc(UUID promptId);

    PromptVersion findFirstByPromptIdOrderByVersionNumberDesc(UUID promptId);
}
