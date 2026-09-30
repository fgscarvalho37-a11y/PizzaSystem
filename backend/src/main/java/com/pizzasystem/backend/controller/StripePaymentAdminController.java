package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.StripeConnectService;
import com.pizzasystem.backend.service.StripeStorePaymentService;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.net.URI;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/stripe-payment")
public class StripePaymentAdminController {

    private final CurrentStoreService
            currentStoreService;

    private final StripeStorePaymentService
            stripeStorePaymentService;

    private final StripeConnectService
            stripeConnectService;

    @Value("${PIZZASYSTEM_PUBLIC_APP_URL:https://pizzasystem.orbitta.space}")
    private String frontendUrl;

    public StripePaymentAdminController(
            CurrentStoreService currentStoreService,
            StripeStorePaymentService stripeStorePaymentService,
            StripeConnectService stripeConnectService
    ) {
        this.currentStoreService =
                currentStoreService;

        this.stripeStorePaymentService =
                stripeStorePaymentService;

        this.stripeConnectService =
                stripeConnectService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return ResponseEntity.ok(
                stripeStorePaymentService
                        .getConnectionStatus(
                                store
                        )
        );
    }

    @PostMapping("/connect")
    public ResponseEntity<Map<String, String>> connect() {

        String authorizationUrl =
                stripeConnectService
                        .createAuthorizationUrl();

        return ResponseEntity.ok(
                Map.of(
                        "authorizationUrl",
                        authorizationUrl
                )
        );
    }

    @GetMapping("/onboarding/return")
    public ResponseEntity<Void> onboardingReturn(
            @RequestParam(required = false)
            String state
    ) {

        try {
            Store store =
                    stripeConnectService
                            .processOnboardingReturn(
                                    state
                            );

            return redirectToFrontend(
                    store != null
            );

        } catch (Exception exception) {
            return redirectToFrontend(
                    false
            );
        }
    }

    @GetMapping("/onboarding/refresh")
    public ResponseEntity<Void> onboardingRefresh(
            @RequestParam(required = false)
            String state
    ) {

        try {
            String onboardingUrl =
                    stripeConnectService
                            .refreshOnboardingUrl(
                                    state
                            );

            return ResponseEntity
                    .status(
                            HttpStatus.FOUND
                    )
                    .location(
                            URI.create(
                                    onboardingUrl
                            )
                    )
                    .build();

        } catch (Exception exception) {
            return redirectToFrontend(
                    false
            );
        }
    }

    @PostMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        stripeStorePaymentService
                .disconnect(
                        store
                );

        return ResponseEntity.ok(
                Map.of(
                        "success",
                        true
                )
        );
    }

    private ResponseEntity<Void> redirectToFrontend(
            boolean success
    ) {

        String base =
                frontendUrl.endsWith("/")
                        ? frontendUrl.substring(
                                0,
                                frontendUrl.length() - 1
                        )
                        : frontendUrl;

        String redirectUrl =
                base
                        + "/admin/pagamentos?stripe="
                        + (
                                success
                                        ? "connected"
                                        : "error"
                        );

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
