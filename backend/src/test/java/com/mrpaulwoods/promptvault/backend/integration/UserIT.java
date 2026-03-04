package com.mrpaulwoods.promptvault.backend.integration;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "classpath:cleanup.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class UserIT extends IntegrationTestBase {

    private Cookie jwtCookie;

    @BeforeEach
    void setUp() throws Exception {
        jwtCookie = registerAndLogin("user@example.com", "password123");
    }

    @Test
    void getMe_ShouldReturnAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/me").cookie(jwtCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void getMe_WithoutAuth_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().is4xxClientError());
    }
}
