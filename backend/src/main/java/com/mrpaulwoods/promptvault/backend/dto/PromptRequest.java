package com.mrpaulwoods.promptvault.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    private String currentBody;

    private UUID folderId;
    private Boolean isFavorite;
    private String comments;
}
