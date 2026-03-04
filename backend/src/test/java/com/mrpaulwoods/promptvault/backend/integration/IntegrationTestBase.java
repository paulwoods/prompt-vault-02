package com.mrpaulwoods.promptvault.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.LoginRequest;
import com.mrpaulwoods.promptvault.backend.dto.RegisterRequest;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

abstract class IntegrationTestBase {

    protected final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired
    protected MockMvc mockMvc;

    protected Cookie registerAndLogin(String email, String password) throws Exception {
        RegisterRequest register = new RegisterRequest();
        register.setEmail(email);
        register.setPassword(password);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword(password);

        var result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andReturn();

        return result.getResponse().getCookie("jwt");
    }
}
