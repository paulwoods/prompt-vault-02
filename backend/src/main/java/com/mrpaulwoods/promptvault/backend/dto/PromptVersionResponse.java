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
public class PromptVersionResponse {
    private UUID id;
    private UUID promptId;
    private Integer versionNumber;
    private String bodySnapshot;
    private Instant createdAt;
}
