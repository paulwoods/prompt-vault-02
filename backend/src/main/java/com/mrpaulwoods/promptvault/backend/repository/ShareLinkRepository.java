package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.ShareLink;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareLinkRepository extends ListCrudRepository<ShareLink, UUID> {

    List<ShareLink> findAllByPromptIdAndDeletedAtIsNull(UUID promptId);

    Optional<ShareLink> findByTokenAndDeletedAtIsNull(String token);

    Optional<ShareLink> findByToken(String token);

    Optional<ShareLink> findByIdAndDeletedAtIsNull(UUID id);
}
