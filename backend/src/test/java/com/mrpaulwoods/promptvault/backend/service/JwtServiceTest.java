package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
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
        return org.springframework.security.core.userdetails.User.builder()
                .username(email)
                .password("password")
                .authorities(List.of())
                .build();
    }

    private User buildUser(String email, Instant passwordChangedAt) {
        return User.builder()
                .id(java.util.UUID.randomUUID())
                .email(email)
                .passwordHash("hash")
                .passwordChangedAt(passwordChangedAt)
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
    void isTokenValid_WhenIssuedBeforePasswordChange_ShouldReturnFalse() {
        User user = buildUser("test@example.com", null);
        String token = jwtService.generateToken(user);

        // Simulate password change after token was issued
        user.setPasswordChangedAt(Instant.now().plusSeconds(1));

        boolean valid = jwtService.isTokenValid(token, user);

        assertThat(valid).isFalse();
    }

    @Test
    void isTokenValid_WhenIssuedAfterPasswordChange_ShouldReturnTrue() {
        User user = buildUser("test@example.com", Instant.now().minusSeconds(60));
        String token = jwtService.generateToken(user);

        boolean valid = jwtService.isTokenValid(token, user);

        assertThat(valid).isTrue();
    }

    @Test
    void isTokenValid_WhenPasswordChangedAtIsNull_ShouldReturnTrue() {
        User user = buildUser("test@example.com", null);
        String token = jwtService.generateToken(user);

        boolean valid = jwtService.isTokenValid(token, user);

        assertThat(valid).isTrue();
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
