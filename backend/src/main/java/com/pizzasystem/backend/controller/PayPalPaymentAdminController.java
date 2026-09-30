package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PayPalPartnerService;
import com.pizzasystem.backend.service.PayPalStorePaymentService;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.net.URI;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/paypal-payment")
public class PayPalPaymentAdminController {

    private final CurrentStoreService
            currentStoreService;

    private final PayPalStorePaymentService
            payPalStorePaymentService;

    private final PayPalPartnerService
            payPalPartnerService;

    @Value("${PIZZASYSTEM_PUBLIC_APP_URL:https://pizzasystem.orbitta.space}")
    private String frontendUrl;

    public PayPalPaymentAdminController(
            CurrentStoreService currentStoreService,
            PayPalStorePaymentService payPalStorePaymentService,
            PayPalPartnerService payPalPartnerService
    ) {
        this.currentStoreService =
                currentStoreService;

        this.payPalStorePaymentService =
                payPalStorePaymentService;

        this.payPalPartnerService =
                payPalPartnerService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return ResponseEntity.ok(
                payPalStorePaymentService
                        .getConnectionStatus(
                                store
                        )
        );
    }

    @PostMapping("/connect")
    public ResponseEntity<Map<String, String>> connect() {

        String onboardingUrl =
                payPalPartnerService
                        .createOnboardingUrl();

        return ResponseEntity.ok(
                Map.of(
                        "onboardingUrl",
                        onboardingUrl
                )
        );
    }

    @PutMapping("/legacy-connect")
    public ResponseEntity<Map<String, Object>> legacyConnect(
            @RequestBody PayPalLegacyConnectRequest request
    ) {

        if (
                request == null
        ) {
            throw new IllegalArgumentException(
                    "Credenciais PayPal não informadas."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        return ResponseEntity.ok(
                payPalStorePaymentService
                        .connect(
                                store,
                                request.clientId(),
                                request.clientSecret(),
                                request.sandbox()
                        )
        );
    }

    @GetMapping("/onboarding/return")
    public ResponseEntity<Void> onboardingReturn(
            @RequestParam(
                    name = "merchantId",
                    required = false
            )
            String trackingId,

            @RequestParam(
                    name = "merchantIdInPayPal",
                    required = false
            )
            String merchantIdInPayPal,

            @RequestParam(
                    name = "permissionsGranted",
                    required = false
            )
            String permissionsGranted,

            @RequestParam(
                    name = "consentStatus",
                    required = false
            )
            String consentStatus,

            @RequestParam(
                    name = "isEmailConfirmed",
                    required = false
            )
            String isEmailConfirmed,

            @RequestParam(
                    name = "accountStatus",
                    required = false
            )
            String accountStatus
    ) {

        try {
            Store store =
                    payPalPartnerService
                            .completeOnboarding(
                                    trackingId,
                                    merchantIdInPayPal,
                                    parseBoolean(
                                            permissionsGranted
                                    ),
                                    parseBoolean(
                                            consentStatus
                                    ),
                                    parseBoolean(
                                            isEmailConfirmed
                                    ),
                                    accountStatus
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

    @PostMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        payPalStorePaymentService
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
                        + "/admin/pagamentos?paypal="
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

    private boolean parseBoolean(
            String value
    ) {
        return "true".equalsIgnoreCase(
                value
        );
    }

    public record PayPalLegacyConnectRequest(
            String clientId,
            String clientSecret,
            boolean sandbox
    ) {
    }
}
