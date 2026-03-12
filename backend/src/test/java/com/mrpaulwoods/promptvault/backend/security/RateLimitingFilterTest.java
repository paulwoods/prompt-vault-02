package com.mrpaulwoods.promptvault.backend.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitingFilterTest {

    private RateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
    }

    @Test
    void shouldAllowRequestsUnderLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");
        request.setRemoteAddr("10.0.0.1");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void shouldReturn429WhenLimitExceeded() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/auth/login");
        request.setRemoteAddr("10.0.0.2");

        FilterChain chain = mock(FilterChain.class);

        // Exhaust the bucket (10 requests allowed per minute)
        for (int i = 0; i < 10; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(request, response, chain);
        }

        // 11th request should be rate limited
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
        verify(chain, times(10)).doFilter(any(), any());
    }

    @Test
    void shouldNotRateLimitNonAuthPaths() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/prompts");
        request.setRemoteAddr("10.0.0.3");

        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
    }

    @Test
    void shouldTrackBucketPerIpAddress() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest requestIp1 = new MockHttpServletRequest();
        requestIp1.setRequestURI("/api/auth/login");
        requestIp1.setRemoteAddr("10.0.0.4");

        MockHttpServletRequest requestIp2 = new MockHttpServletRequest();
        requestIp2.setRequestURI("/api/auth/login");
        requestIp2.setRemoteAddr("10.0.0.5");

        // Exhaust bucket for IP1
        for (int i = 0; i < 10; i++) {
            filter.doFilterInternal(requestIp1, new MockHttpServletResponse(), chain);
        }
        MockHttpServletResponse ip1Response = new MockHttpServletResponse();
        filter.doFilterInternal(requestIp1, ip1Response, chain);
        assertThat(ip1Response.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());

        // IP2 should still be allowed
        MockHttpServletResponse ip2Response = new MockHttpServletResponse();
        filter.doFilterInternal(requestIp2, ip2Response, chain);
        assertThat(ip2Response.getStatus()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS.value());
    }
}
