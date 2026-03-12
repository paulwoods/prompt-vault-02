package com.mrpaulwoods.promptvault.backend.service;

import com.mrpaulwoods.promptvault.backend.dto.AuthResponse;
import com.mrpaulwoods.promptvault.backend.dto.LoginRequest;
import com.mrpaulwoods.promptvault.backend.dto.RegisterRequest;
import com.mrpaulwoods.promptvault.backend.dto.UserResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.argThat;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        ReflectionTestUtils.setField(authService, "cookieSecure", false);
    }

    @Test
    void register_ShouldSaveUserAndReturnUserResponse() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password");

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("encoded_password")
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = authService.register(registerRequest);

        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getId()).isEqualTo(savedUser.getId());
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_WhenEmailAlreadyExists_ShouldThrowException() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_ShouldAuthenticateAndReturnTokenInCookie() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("encoded_password")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("jwt_token");

        HttpServletResponse response = mock(HttpServletResponse.class);

        AuthResponse authResponse = authService.login(loginRequest, response);

        assertThat(authResponse.getEmail()).isEqualTo("test@example.com");
        assertThat(authResponse.getMessage()).isEqualTo("Login successful");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(response).addHeader(anyString(), anyString());
    }

    @Test
    void login_WhenUserNotFound_ShouldThrowException() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        HttpServletResponse response = mock(HttpServletResponse.class);

        assertThatThrownBy(() -> authService.login(loginRequest, response))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void logout_ShouldClearJwtCookie() {
        HttpServletResponse response = mock(HttpServletResponse.class);

        authService.logout(response);

        verify(response).addHeader(anyString(), anyString());
    }

    @Test
    void login_WhenCookieSecureTrue_ShouldSetSecureFlag() {
        ReflectionTestUtils.setField(authService, "cookieSecure", true);

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("encoded_password")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("jwt_token");

        HttpServletResponse response = mock(HttpServletResponse.class);
        authService.login(loginRequest, response);

        verify(response).addHeader(eq("Set-Cookie"), argThat(header -> header.contains("Secure")));
    }

    @Test
    void login_WhenCookieSecureFalse_ShouldNotSetSecureFlag() {
        ReflectionTestUtils.setField(authService, "cookieSecure", false);

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("encoded_password")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("jwt_token");

        HttpServletResponse response = mock(HttpServletResponse.class);
        authService.login(loginRequest, response);

        verify(response).addHeader(eq("Set-Cookie"), argThat(header -> !header.contains("Secure")));
    }

    @Test
    void logout_WhenCookieSecureTrue_ShouldSetSecureFlag() {
        ReflectionTestUtils.setField(authService, "cookieSecure", true);

        HttpServletResponse response = mock(HttpServletResponse.class);
        authService.logout(response);

        verify(response).addHeader(eq("Set-Cookie"), argThat(header -> header.contains("Secure")));
    }

    @Test
    void login_ShouldSetSameSiteStrict() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("encoded_password")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any())).thenReturn("jwt_token");

        HttpServletResponse response = mock(HttpServletResponse.class);
        authService.login(loginRequest, response);

        verify(response).addHeader(eq("Set-Cookie"), argThat(header -> header.contains("SameSite=Strict")));
    }

    @Test
    void logout_ShouldSetSameSiteStrict() {
        HttpServletResponse response = mock(HttpServletResponse.class);
        authService.logout(response);

        verify(response).addHeader(eq("Set-Cookie"), argThat(header -> header.contains("SameSite=Strict")));
    }
}
