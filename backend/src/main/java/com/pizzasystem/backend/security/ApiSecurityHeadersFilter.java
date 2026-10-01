package com.pizzasystem.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiSecurityHeadersFilter
        extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path =
                request.getRequestURI();

        if (
                path != null &&
                path.startsWith(
                        "/api/"
                )
        ) {
            response.setHeader(
                    "Cache-Control",
                    "no-store, no-cache, must-revalidate"
            );

            response.setHeader(
                    "Pragma",
                    "no-cache"
            );

            response.setHeader(
                    "X-Content-Type-Options",
                    "nosniff"
            );

            response.setHeader(
                    "X-Frame-Options",
                    "DENY"
            );

            response.setHeader(
                    "Referrer-Policy",
                    "no-referrer"
            );

            response.setHeader(
                    "Permissions-Policy",
                    "camera=(), microphone=(), geolocation=(), usb=()"
            );

            String forwardedProto =
                    request.getHeader(
                            "X-Forwarded-Proto"
                    );

            if (
                    request.isSecure() ||
                    "https".equalsIgnoreCase(
                            forwardedProto
                    )
            ) {
                response.setHeader(
                        "Strict-Transport-Security",
                        "max-age=63072000; includeSubDomains"
                );
            }
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}
