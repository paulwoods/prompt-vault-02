package com.mrpaulwoods.promptvault.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("prompt")
public class Prompt {
    @Id
    private UUID id;

    private UUID userId;

    private UUID folderId;

    private String title;

    private String currentBody;

    private boolean isFavorite;

    private String comments;

    private UUID forkedFromPromptId;

    private String forkedFromAuthor;

    @Version
    private Integer rowVersion;

    private Instant deletedAt;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
