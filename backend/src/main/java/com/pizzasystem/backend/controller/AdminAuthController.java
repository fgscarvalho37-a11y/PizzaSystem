package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.service.AdminAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(
        origins = "http://localhost:3000",
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/auth")
public class AdminAuthController {

    private static final String SESSION_ADMIN_ID =
            "ADMIN_USER_ID";

    private static final String SESSION_ADMIN_EMAIL =
            "ADMIN_USER_EMAIL";

    private final AdminAuthService adminAuthService;

    public AdminAuthController(
            AdminAuthService adminAuthService
    ) {
        this.adminAuthService =
                adminAuthService;
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {

        try {

            AdminUser user =
                    adminAuthService.authenticate(
                            request.email(),
                            request.password()
                    );

            HttpSession oldSession =
                    servletRequest.getSession(
                            false
                    );

            if (oldSession != null) {
                oldSession.invalidate();
            }

            HttpSession session =
                    servletRequest.getSession(
                            true
                    );

            session.setAttribute(
                    SESSION_ADMIN_ID,
                    user.getId()
            );

            session.setAttribute(
                    SESSION_ADMIN_EMAIL,
                    user.getEmail()
            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "authenticated",
                    true
            );

            response.put(
                    "id",
                    user.getId()
            );

            response.put(
                    "email",
                    user.getEmail()
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (RuntimeException e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "authenticated",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(response);
        }
    }

    // =========================
    // LOGOUT
    // =========================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(
                        false
                );

        if (session != null) {
            session.invalidate();
        }

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                false
        );

        response.put(
                "message",
                "Logout realizado com sucesso"
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // SESSÃO ATUAL
    // =========================

    @GetMapping("/me")
    public ResponseEntity<?> me(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(
                        false
                );

        if (session == null) {

            return unauthorized();
        }

        Object adminId =
                session.getAttribute(
                        SESSION_ADMIN_ID
                );

        Object adminEmail =
                session.getAttribute(
                        SESSION_ADMIN_EMAIL
                );

        if (adminId == null
                || adminEmail == null) {

            return unauthorized();
        }

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                true
        );

        response.put(
                "id",
                adminId
        );

        response.put(
                "email",
                adminEmail
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // AUXILIAR
    // =========================

    private ResponseEntity<?> unauthorized() {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                false
        );

        return ResponseEntity
                .status(
                        HttpStatus.UNAUTHORIZED
                )
                .body(response);
    }

    // =========================
    // DTO
    // =========================

    public record LoginRequest(
            String email,
            String password
    ) {
    }
}