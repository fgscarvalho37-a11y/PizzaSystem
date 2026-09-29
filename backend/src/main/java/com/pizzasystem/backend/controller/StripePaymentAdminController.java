package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.StripeStorePaymentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/stripe-payment")
public class StripePaymentAdminController {

    private final CurrentStoreService
            currentStoreService;

    private final StripeStorePaymentService
            stripeStorePaymentService;

    public StripePaymentAdminController(
            CurrentStoreService currentStoreService,
            StripeStorePaymentService stripeStorePaymentService
    ) {
        this.currentStoreService =
                currentStoreService;

        this.stripeStorePaymentService =
                stripeStorePaymentService;
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

    @PutMapping("/connect")
    public ResponseEntity<Map<String, Object>> connect(
            @RequestBody StripeConnectRequest request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Credenciais Stripe não informadas."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        return ResponseEntity.ok(
                stripeStorePaymentService
                        .connect(
                                store,
                                request.restrictedApiKey(),
                                request.webhookSecret(),
                                request.publishableKey()
                        )
        );
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

    public record StripeConnectRequest(
            String restrictedApiKey,
            String webhookSecret,
            String publishableKey
    ) {
    }
}
