package com.todoapp.todoapp.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Güvenlik filtreleri controller advice dışında çalıştığı için ayrı hata yazıcısı kullanılır. */
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws IOException {
        response.setHeader("WWW-Authenticate", "Bearer");
        write(response, 401, "{\"type\":\"about:blank\",\"title\":\"Unauthorized\","
                + "\"status\":401,\"detail\":\"Geçerli kimlik doğrulaması gereklidir.\"}");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws IOException {
        write(response, 403, "{\"type\":\"about:blank\",\"title\":\"Forbidden\","
                + "\"status\":403,\"detail\":\"Bu işlem için erişim yetkiniz yok.\"}");
    }

    private void write(HttpServletResponse response, int status, String body) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/problem+json");
        // Yalnızca sabit metinler yazılır; token veya exception ayrıntıları yansıtılmaz.
        response.getWriter().write(body);
    }
}
