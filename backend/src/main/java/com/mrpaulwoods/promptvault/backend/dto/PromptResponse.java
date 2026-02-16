package com.mrpaulwoods.promptvault.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromptResponse {
    private UUID id;
    private UUID userId;
    private UUID folderId;
    private String title;
    private String currentBody;
    private boolean isFavorite;
    private String comments;
    private UUID forkedFromPromptId;
    private String forkedFromAuthor;
    private Integer rowVersion;
    private Instant createdAt;
    private Instant updatedAt;
}
