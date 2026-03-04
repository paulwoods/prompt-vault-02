package com.mrpaulwoods.promptvault.backend.security;

import com.mrpaulwoods.promptvault.backend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private FilterChain filterChain;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_WithNoCookies_ShouldContinueChainWithoutAuth() throws Exception {
        when(request.getCookies()).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_WithNoJwtCookie_ShouldContinueChainWithoutAuth() throws Exception {
        Cookie otherCookie = new Cookie("session", "some-value");
        when(request.getCookies()).thenReturn(new Cookie[]{otherCookie});

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_WithValidJwtCookie_ShouldSetAuthentication() throws Exception {
        String token = "valid_token";
        Cookie jwtCookie = new Cookie("jwt", token);
        when(request.getCookies()).thenReturn(new Cookie[]{jwtCookie});
        when(jwtService.extractEmail(token)).thenReturn("test@example.com");

        UserDetails userDetails = User.builder()
                .username("test@example.com")
                .password("password")
                .authorities(List.of())
                .build();

        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(userDetails);
        when(jwtService.isTokenValid(token, userDetails)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName())
                .isEqualTo("test@example.com");
    }

    @Test
    void doFilterInternal_WithInvalidJwtToken_ShouldNotSetAuthentication() throws Exception {
        String token = "invalid_token";
        Cookie jwtCookie = new Cookie("jwt", token);
        when(request.getCookies()).thenReturn(new Cookie[]{jwtCookie});
        when(jwtService.extractEmail(token)).thenReturn("test@example.com");

        UserDetails userDetails = User.builder()
                .username("test@example.com")
                .password("password")
                .authorities(List.of())
                .build();

        when(userDetailsService.loadUserByUsername("test@example.com")).thenReturn(userDetails);
        when(jwtService.isTokenValid(token, userDetails)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_WhenAlreadyAuthenticated_ShouldNotOverrideAuth() throws Exception {
        String token = "valid_token";
        Cookie jwtCookie = new Cookie("jwt", token);
        when(request.getCookies()).thenReturn(new Cookie[]{jwtCookie});
        when(jwtService.extractEmail(token)).thenReturn("test@example.com");

        // Pre-set authentication in context
        UserDetails userDetails = User.builder()
                .username("test@example.com")
                .password("password")
                .authorities(List.of())
                .build();
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken existingAuth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        filter.doFilterInternal(request, response, filterChain);

        verify(userDetailsService, never()).loadUserByUsername(any());
        verify(filterChain).doFilter(request, response);
    }
}
