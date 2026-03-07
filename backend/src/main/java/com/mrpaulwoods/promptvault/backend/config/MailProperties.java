package com.mrpaulwoods.promptvault.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private String from = "noreply@promptvault.app";
    private String baseUrl = "http://localhost:5173";
}
