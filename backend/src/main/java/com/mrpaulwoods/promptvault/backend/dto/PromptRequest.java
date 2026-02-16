package com.mrpaulwoods.promptvault.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromptRequest {
    private String title;
    private String currentBody;
    private UUID folderId;
    private boolean isFavorite;
    private String comments;
}
