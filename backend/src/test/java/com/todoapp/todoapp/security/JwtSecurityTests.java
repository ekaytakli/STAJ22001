package com.todoapp.todoapp.security;

import com.todoapp.todoapp.entity.User;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtSecurityTests {
    private final String secret = Base64.getEncoder().encodeToString(
            Keys.secretKeyFor(SignatureAlgorithm.HS256).getEncoded());
    private final JwtService service = new JwtService(secret);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void generatedTokenResolvesUsername() {
        User user = new User();
        user.setUsername("test-user");
        assertEquals("test-user", service.validateAndExtractUsername(service.generateToken(user)));
    }

    @Test
    void expiredWronglySignedAndIncompleteTokensAreRejected() {
        var key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String expired = Jwts.builder().setSubject("test-user")
                .setExpiration(new Date(System.currentTimeMillis() - 60_000)).signWith(key).compact();
        String noExpiration = Jwts.builder().setSubject("test-user").signWith(key).compact();
        String noSubject = Jwts.builder().setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key).compact();
        String wrongSignature = Jwts.builder().setSubject("test-user")
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.secretKeyFor(SignatureAlgorithm.HS256)).compact();
        for (String token : new String[]{expired, noExpiration, noSubject, wrongSignature, "malformed"}) {
            assertThrows(JwtException.class, () -> service.validateAndExtractUsername(token));
        }
    }

    @Test
    void invalidTokenReturns401WithoutInvokingController() throws Exception {
        var users = mock(UserDetailsServiceImpl.class);
        var chain = mock(FilterChain.class);
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer malformed");
        var response = new MockHttpServletResponse();
        new JwtAuthenticationFilter(service, users, new SecurityErrorHandler()).doFilter(request, response, chain);
        assertEquals(401, response.getStatus());
        assertEquals("Bearer", response.getHeader("WWW-Authenticate"));
        assertTrue(response.getContentType().startsWith("application/problem+json"));
        assertFalse(response.getContentAsString().contains("malformed"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(users, chain);
    }

    @Test
    void validTokenAuthenticatesAndContinuesChain() throws Exception {
        var users = mock(UserDetailsServiceImpl.class);
        User user = new User();
        user.setUsername("test-user");
        var principal = new UserPrincipal(user);
        when(users.loadUserByUsername("test-user")).thenReturn(principal);
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + service.generateToken(user));
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        new JwtAuthenticationFilter(service, users, new SecurityErrorHandler()).doFilter(request, response, chain);
        assertSame(principal, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        verify(chain).doFilter(request, response);
    }

    @Test
    void deletedUserIsRejectedWithoutContinuingChain() throws Exception {
        var users = mock(UserDetailsServiceImpl.class);
        when(users.loadUserByUsername("test-user"))
                .thenThrow(new org.springframework.security.core.userdetails.UsernameNotFoundException("deleted"));
        User user = new User();
        user.setUsername("test-user");
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + service.generateToken(user));
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);
        new JwtAuthenticationFilter(service, users, new SecurityErrorHandler()).doFilter(request, response, chain);
        assertEquals(401, response.getStatus());
        verifyNoInteractions(chain);
    }

    @Test
    void infrastructureFailureIsNotConvertedTo401() {
        var users = mock(UserDetailsServiceImpl.class);
        when(users.loadUserByUsername("test-user"))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));
        User user = new User();
        user.setUsername("test-user");
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + service.generateToken(user));
        assertThrows(DataAccessResourceFailureException.class, () ->
                new JwtAuthenticationFilter(service, users, new SecurityErrorHandler())
                        .doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class)));
    }

    @Test
    void unauthenticatedAndForbiddenResponsesHaveDifferentStatusCodes() throws Exception {
        var handler = new SecurityErrorHandler();
        var request = new MockHttpServletRequest();
        var unauthenticated = new MockHttpServletResponse();
        handler.commence(request, unauthenticated, new BadCredentialsException("internal detail"));
        var forbidden = new MockHttpServletResponse();
        handler.handle(request, forbidden, new org.springframework.security.access.AccessDeniedException("internal detail"));
        assertEquals(401, unauthenticated.getStatus());
        assertEquals(403, forbidden.getStatus());
        assertFalse(forbidden.getContentAsString().contains("internal detail"));
    }
}
