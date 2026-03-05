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
public class PublicShareResponse {

    private UUID promptId;
    private String title;
    private String body;
    private Instant sharedAt;
}
