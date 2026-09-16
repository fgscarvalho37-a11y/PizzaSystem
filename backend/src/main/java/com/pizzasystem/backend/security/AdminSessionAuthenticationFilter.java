package com.pizzasystem.backend.security;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.repository.AdminUserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
public class AdminSessionAuthenticationFilter
        extends OncePerRequestFilter {

    private static final String SESSION_ADMIN_ID =
            "ADMIN_USER_ID";

    private static final String SESSION_ADMIN_EMAIL =
            "ADMIN_USER_EMAIL";

    private final AdminUserRepository
            adminUserRepository;

    public AdminSessionAuthenticationFilter(
            AdminUserRepository adminUserRepository
    ) {
        this.adminUserRepository =
                adminUserRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        System.out.println(
                "[ADMIN FILTER] "
                        + request.getMethod()
                        + " "
                        + request.getRequestURI()
        );

        System.out.println(
                "[ADMIN FILTER] Session ID: "
                        + request.getSession(false)
        );

        if (SecurityContextHolder
                .getContext()
                .getAuthentication() == null) {

            HttpSession session =
                    request.getSession(false);

            if (session != null) {

                Object adminIdValue =
                        session.getAttribute(
                                SESSION_ADMIN_ID
                        );

                Object adminEmailValue =
                        session.getAttribute(
                                SESSION_ADMIN_EMAIL
                        );

                System.out.println(
                        "[ADMIN FILTER] ADMIN_USER_ID: "
                                + adminIdValue
                );

                System.out.println(
                        "[ADMIN FILTER] ADMIN_USER_EMAIL: "
                                + adminEmailValue
                );

                if (adminIdValue != null
                        && adminEmailValue != null) {

                    Long adminId =
                            convertToLong(
                                    adminIdValue
                            );

                    if (adminId == null) {

                        System.out.println(
                                "[ADMIN FILTER] ID inválido"
                        );

                        invalidateSession(
                                session
                        );

                    } else {

                        Optional<AdminUser> optionalAdmin =
                                adminUserRepository
                                        .findById(
                                                adminId
                                        );

                        if (optionalAdmin.isEmpty()) {

                            System.out.println(
                                    "[ADMIN FILTER] Admin não encontrado"
                            );

                            invalidateSession(
                                    session
                            );

                        } else {

                            AdminUser admin =
                                    optionalAdmin.get();

                            if (!admin.isActive()) {

                                System.out.println(
                                        "[ADMIN FILTER] Admin inativo"
                                );

                                invalidateSession(
                                        session
                                );

                            } else {

                                session.setAttribute(
                                        SESSION_ADMIN_EMAIL,
                                        admin.getEmail()
                                );

                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(
                                                admin.getEmail(),
                                                null,
                                                List.of(
                                                        new SimpleGrantedAuthority(
                                                                "ROLE_ADMIN"
                                                        )
                                                )
                                        );

                                authentication.setDetails(
                                        admin.getId()
                                );

                                SecurityContextHolder
                                        .getContext()
                                        .setAuthentication(
                                                authentication
                                        );

                                System.out.println(
                                        "[ADMIN FILTER] AUTH OK - "
                                                + admin.getEmail()
                                                + " - ROLE_ADMIN"
                                );
                            }
                        }
                    }
                }
            } else {

                System.out.println(
                        "[ADMIN FILTER] SEM SESSÃO"
                );
            }

        } else {

            System.out.println(
                    "[ADMIN FILTER] Já autenticado: "
                            + SecurityContextHolder
                            .getContext()
                            .getAuthentication()
            );
        }

        System.out.println(
                "[ADMIN FILTER] Antes do próximo filtro: "
                        + SecurityContextHolder
                        .getContext()
                        .getAuthentication()
        );

        filterChain.doFilter(
                request,
                response
        );

        System.out.println(
                "[ADMIN FILTER] Resposta: "
                        + response.getStatus()
        );
    }

    private Long convertToLong(
            Object value
    ) {

        if (value instanceof Long longValue) {
            return longValue;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        try {

            return Long.valueOf(
                    value.toString()
            );

        } catch (NumberFormatException e) {

            return null;
        }
    }

    private void invalidateSession(
            HttpSession session
    ) {

        try {
            session.invalidate();
        } catch (IllegalStateException ignored) {
        }

        SecurityContextHolder
                .clearContext();
    }
}