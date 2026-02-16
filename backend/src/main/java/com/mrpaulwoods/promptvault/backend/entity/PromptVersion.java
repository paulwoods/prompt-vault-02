package com.mrpaulwoods.promptvault.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("prompt_version")
public class PromptVersion {
    @Id
    private UUID id;

    private UUID promptId;

    private Integer versionNumber;

    private String bodySnapshot;

    @CreatedDate
    private Instant createdAt;
}
