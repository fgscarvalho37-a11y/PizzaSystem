package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PayPalStorePaymentService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/paypal-payment")
public class PayPalPaymentAdminController {

    private final CurrentStoreService currentStoreService;
    private final PayPalStorePaymentService payPalStorePaymentService;

    public PayPalPaymentAdminController(
            CurrentStoreService currentStoreService,
            PayPalStorePaymentService payPalStorePaymentService
    ) {
        this.currentStoreService = currentStoreService;
        this.payPalStorePaymentService = payPalStorePaymentService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Store store = currentStoreService.getCurrentStore();

        return ResponseEntity.ok(
                payPalStorePaymentService.getConnectionStatus(store)
        );
    }

    @PutMapping("/connect")
    public ResponseEntity<Map<String, Object>> connect(
            @RequestBody PayPalConnectRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Credenciais PayPal não informadas."
            );
        }

        Store store = currentStoreService.getCurrentStore();

        return ResponseEntity.ok(
                payPalStorePaymentService.connect(
                        store,
                        request.clientId(),
                        request.clientSecret(),
                        request.sandbox()
                )
        );
    }

    @PostMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect() {
        Store store = currentStoreService.getCurrentStore();

        payPalStorePaymentService.disconnect(store);

        return ResponseEntity.ok(
                Map.of("success", true)
        );
    }

    public record PayPalConnectRequest(
            String clientId,
            String clientSecret,
            boolean sandbox
    ) {
    }
}
