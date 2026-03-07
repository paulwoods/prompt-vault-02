package com.mrpaulwoods.promptvault.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailShareRequest {

    @NotBlank
    @Email
    private String recipientEmail;
}
