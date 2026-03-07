package com.mrpaulwoods.promptvault.backend.repository;

import com.mrpaulwoods.promptvault.backend.entity.PasswordResetToken;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends ListCrudRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenAndDeletedAtIsNull(String token);
}
