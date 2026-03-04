package com.mrpaulwoods.promptvault.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    // 64-byte hex string for HS512 key (min 512 bits)
    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION = 3600000L; // 1 hour
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret", SECRET);
        ReflectionTestUtils.setField(jwtService, "expiration", EXPIRATION);
    }

    private UserDetails buildUserDetails(String email) {
        return User.builder()
                .username(email)
                .password("password")
                .authorities(List.of())
                .build();
    }

    @Test
    void generateToken_ShouldReturnNonNullToken() {
        UserDetails userDetails = buildUserDetails("test@example.com");

        String token = jwtService.generateToken(userDetails);

        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void extractEmail_ShouldReturnCorrectEmail() {
        UserDetails userDetails = buildUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        String email = jwtService.extractEmail(token);

        assertThat(email).isEqualTo("test@example.com");
    }

    @Test
    void isTokenValid_WithValidToken_ShouldReturnTrue() {
        UserDetails userDetails = buildUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        boolean valid = jwtService.isTokenValid(token, userDetails);

        assertThat(valid).isTrue();
    }

    @Test
    void isTokenValid_WithWrongUser_ShouldReturnFalse() {
        UserDetails userDetails = buildUserDetails("test@example.com");
        UserDetails otherUser = buildUserDetails("other@example.com");
        String token = jwtService.generateToken(userDetails);

        boolean valid = jwtService.isTokenValid(token, otherUser);

        assertThat(valid).isFalse();
    }

    @Test
    void isTokenValid_WithExpiredToken_ShouldReturnFalse() {
        ReflectionTestUtils.setField(jwtService, "expiration", -1000L);
        UserDetails userDetails = buildUserDetails("test@example.com");
        String token = jwtService.generateToken(userDetails);

        // Reset to normal expiration so the token is parsed, just expired
        ReflectionTestUtils.setField(jwtService, "expiration", EXPIRATION);

        assertThatThrownBy(() -> jwtService.isTokenValid(token, userDetails))
                .isInstanceOf(Exception.class);
    }

    @Test
    void generateToken_WithExtraClaims_ShouldContainEmail() {
        UserDetails userDetails = buildUserDetails("claims@example.com");
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        extraClaims.put("role", "admin");

        String token = jwtService.generateToken(extraClaims, userDetails);
        String email = jwtService.extractEmail(token);

        assertThat(email).isEqualTo("claims@example.com");
    }
}
