package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.service.MercadoPagoOAuthService;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.net.URI;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/mercadopago")
public class MercadoPagoOAuthController {

    private final MercadoPagoOAuthService
            mercadoPagoOAuthService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public MercadoPagoOAuthController(
            MercadoPagoOAuthService mercadoPagoOAuthService
    ) {
        this.mercadoPagoOAuthService =
                mercadoPagoOAuthService;
    }

    // =========================
    // STATUS DA CONEXÃO
    // =========================

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {

        return ResponseEntity.ok(
                mercadoPagoOAuthService
                        .getConnectionStatus()
        );
    }

    // =========================
    // INICIAR OAUTH
    // =========================

    @PostMapping("/connect")
    public ResponseEntity<Map<String, String>> connect() {

        String authorizationUrl =
                mercadoPagoOAuthService
                        .createAuthorizationUrl();

        Map<String, String> response =
                new HashMap<>();

        response.put(
                "authorizationUrl",
                authorizationUrl
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // CALLBACK MERCADO PAGO
    // =========================

    @GetMapping("/oauth/callback")
    public ResponseEntity<Void> callback(
            @RequestParam(required = false)
            String code,

            @RequestParam(required = false)
            String state,

            @RequestParam(required = false)
            String error,

            @RequestParam(
                    name = "error_description",
                    required = false
            )
            String errorDescription
    ) {

        if (error != null
                && !error.isBlank()) {

            return redirectToFrontend(
                    false
            );
        }

        try {

            Store store =
                    mercadoPagoOAuthService
                            .processCallback(
                                    code,
                                    state
                            );

            if (store == null) {

                return redirectToFrontend(
                        false
                );
            }

            return redirectToFrontend(
                    true
            );

        } catch (Exception exception) {

            return redirectToFrontend(
                    false
            );
        }
    }

    // =========================
    // DESCONECTAR
    // =========================

    @PostMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect() {

        mercadoPagoOAuthService
                .disconnect();

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Mercado Pago desconectado."
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // REDIRECT FRONTEND
    // =========================

    private ResponseEntity<Void> redirectToFrontend(
            boolean success
    ) {

        String separator =
                frontendUrl.contains("?")
                        ? "&"
                        : "?";

        String redirectUrl =
                frontendUrl
                        + "/admin/configuracoes"
                        + separator
                        + "mercadopago="
                        + (success
                                ? "connected"
                                : "error");

        return ResponseEntity
                .status(
                        HttpStatus.FOUND
                )
                .location(
                        URI.create(
                                redirectUrl
                        )
                )
                .build();
    }
}