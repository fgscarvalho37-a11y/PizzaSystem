package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.service.PayPalStorePaymentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PayPalPaymentController {

    private final OrderRepository orderRepository;
    private final PayPalStorePaymentService payPalStorePaymentService;

    public PayPalPaymentController(
            OrderRepository orderRepository,
            PayPalStorePaymentService payPalStorePaymentService
    ) {
        this.orderRepository = orderRepository;
        this.payPalStorePaymentService = payPalStorePaymentService;
    }

    @PostMapping("/{orderId}/paypal/checkout")
    public ResponseEntity<?> createCheckout(
            @PathVariable Long orderId,
            @RequestParam String token,
            @RequestBody(required = false) PayPalCheckoutRequest request
    ) {
        Order order = getOrderForToken(orderId, token);

        String returnOrigin =
                request != null
                        ? request.returnOrigin()
                        : null;

        PayPalStorePaymentService.PayPalCheckoutOrder checkout =
                payPalStorePaymentService.createCheckoutOrder(
                        order,
                        token,
                        returnOrigin
                );

        return ResponseEntity.ok(
                Map.of(
                        "id", checkout.id(),
                        "url", checkout.url(),
                        "status", checkout.status() == null ? "" : checkout.status()
                )
        );
    }

    @PostMapping("/{orderId}/paypal/capture")
    public ResponseEntity<?> capture(
            @PathVariable Long orderId,
            @RequestParam String token,
            @RequestParam String paypalOrderId
    ) {
        Order order = getOrderForToken(orderId, token);

        Order captured =
                payPalStorePaymentService.captureCheckoutOrder(
                        order,
                        paypalOrderId
                );

        return ResponseEntity.ok(
                Map.of(
                        "orderId", captured.getId(),
                        "paymentStatus", captured.getPaymentStatus().name(),
                        "orderStatus", captured.getStatus().name()
                )
        );
    }

    private Order getOrderForToken(
            Long orderId,
            String token
    ) {
        Order order =
                orderRepository
                        .findById(orderId)
                        .orElseThrow(
                                () ->
                                        new org.springframework.web.server.ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Pedido não encontrado."
                                        )
                        );

        if (
                token == null ||
                token.isBlank() ||
                order.getPublicAccessToken() == null ||
                !MessageDigest.isEqual(
                        token.getBytes(StandardCharsets.UTF_8),
                        order.getPublicAccessToken()
                                .getBytes(StandardCharsets.UTF_8)
                )
        ) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Pedido não encontrado."
            );
        }

        return order;
    }

    public record PayPalCheckoutRequest(
            String returnOrigin
    ) {
    }
}
