package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.service.OrbittaProvisionService;
import com.pizzasystem.backend.service.OrbittaProvisionService.ProvisionResult;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/orbitta")
public class OrbittaProvisionController {

    private final OrbittaProvisionService
            orbittaProvisionService;

    @Value("${orbitta.integration-secret:}")
    private String integrationSecret;

    public OrbittaProvisionController(
            OrbittaProvisionService orbittaProvisionService
    ) {
        this.orbittaProvisionService =
                orbittaProvisionService;
    }

    @PostMapping("/provision")
    public ResponseEntity<?> provision(
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorization,
            @RequestBody
            ProvisionRequest request
    ) {

        ResponseEntity<?> authorizationError =
                validateAuthorization(
                        authorization
                );

        if (authorizationError != null) {
            return authorizationError;
        }

        try {

            ProvisionResult result =
                    orbittaProvisionService
                            .provision(
                                    request.orbittaUserId(),
                                    request.orbittaProductId(),
                                    request.email(),
                                    request.name(),
                                    request.planName(),
                                    request.passwordHash()
                            );

            return ResponseEntity.ok(
                    result
            );

        } catch (
                IllegalArgumentException exception
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );

        } catch (
                IllegalStateException exception
        ) {

            return ResponseEntity
                    .status(
                            HttpStatus.CONFLICT
                    )
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );
        }
    }

    @PutMapping("/{orbittaProductId}/storefront")
    public ResponseEntity<?> updateStorefront(
            @PathVariable Long orbittaProductId,
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorization,
            @RequestBody StorefrontRequest request
    ) {

        ResponseEntity<?> authorizationError =
                validateAuthorization(
                        authorization
                );

        if (authorizationError != null) {
            return authorizationError;
        }

        try {
            return ResponseEntity.ok(
                    orbittaProvisionService
                            .updateStorefront(
                                    orbittaProductId,
                                    request != null
                                            ? request.slug()
                                            : null
                            )
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );
        }
    }

    @PostMapping("/{orbittaProductId}/suspend")
    public ResponseEntity<?> suspend(
            @PathVariable Long orbittaProductId,
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorization
    ) {

        ResponseEntity<?> authorizationError =
                validateAuthorization(
                        authorization
                );

        if (authorizationError != null) {
            return authorizationError;
        }

        try {
            return ResponseEntity.ok(
                    orbittaProvisionService
                            .suspend(
                                    orbittaProductId
                            )
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );
        }
    }

    @PostMapping("/{orbittaProductId}/reactivate")
    public ResponseEntity<?> reactivate(
            @PathVariable Long orbittaProductId,
            @RequestHeader(
                    value = "Authorization",
                    required = false
            )
            String authorization
    ) {

        ResponseEntity<?> authorizationError =
                validateAuthorization(
                        authorization
                );

        if (authorizationError != null) {
            return authorizationError;
        }

        try {
            return ResponseEntity.ok(
                    orbittaProvisionService
                            .reactivate(
                                    orbittaProductId
                            )
            );

        } catch (IllegalArgumentException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );
        }
    }

    private ResponseEntity<?> validateAuthorization(
            String authorization
    ) {

        if (
                integrationSecret == null ||
                integrationSecret.isBlank()
        ) {

            return ResponseEntity
                    .status(
                            HttpStatus.SERVICE_UNAVAILABLE
                    )
                    .body(
                            Map.of(
                                    "message",
                                    "Integração Orbitta não configurada."
                            )
                    );
        }

        String expected =
                "Bearer " +
                integrationSecret.trim();

        if (
                authorization == null ||
                !constantTimeEquals(
                        authorization,
                        expected
                )
        ) {

            return ResponseEntity
                    .status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            Map.of(
                                    "message",
                                    "Não autorizado."
                            )
                    );
        }

        return null;
    }

    private boolean constantTimeEquals(
            String left,
            String right
    ) {

        return MessageDigest.isEqual(
                left.getBytes(
                        StandardCharsets.UTF_8
                ),
                right.getBytes(
                        StandardCharsets.UTF_8
                )
        );
    }

    public record ProvisionRequest(
            Long orbittaUserId,
            Long orbittaProductId,
            String email,
            String name,
            String planName,
            String passwordHash
    ) {
    }

    public record StorefrontRequest(
            String slug
    ) {
    }
}
