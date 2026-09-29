package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.MercadoPagoConnectionRepository;
import com.pizzasystem.backend.repository.OrderRepository;

import com.pizzasystem.backend.service.PayPalStorePaymentService;
import com.pizzasystem.backend.service.PublicStoreService;
import com.pizzasystem.backend.service.StripeStorePaymentService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class StripePaymentController {

    private final OrderRepository
            orderRepository;

    private final MercadoPagoConnectionRepository
            mercadoPagoConnectionRepository;

    private final PublicStoreService
            publicStoreService;

    private final StripeStorePaymentService
            stripeStorePaymentService;

    private final PayPalStorePaymentService
            payPalStorePaymentService;

    public StripePaymentController(
            OrderRepository orderRepository,
            MercadoPagoConnectionRepository mercadoPagoConnectionRepository,
            PublicStoreService publicStoreService,
            StripeStorePaymentService stripeStorePaymentService,
            PayPalStorePaymentService payPalStorePaymentService
    ) {
        this.orderRepository =
                orderRepository;

        this.mercadoPagoConnectionRepository =
                mercadoPagoConnectionRepository;

        this.publicStoreService =
                publicStoreService;

        this.stripeStorePaymentService =
                stripeStorePaymentService;

        this.payPalStorePaymentService =
                payPalStorePaymentService;
    }

    // =========================
    // CONFIG PÚBLICA DE PAGAMENTO
    // =========================

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config(
            @RequestParam String store
    ) {

        Store targetStore =
                publicStoreService
                        .getBySlug(
                                store
                        );

        boolean brazil =
                "BR".equalsIgnoreCase(
                        targetStore.getCountryCode()
                );

        var mercadoPagoConnection =
                mercadoPagoConnectionRepository
                        .findByStoreIdAndConnectedTrue(
                                targetStore.getId()
                        );

        boolean mercadoPagoReady =
                mercadoPagoConnection
                        .filter(
                                connection ->
                                        connection.getAccessToken() != null &&
                                        !connection.getAccessToken()
                                                .isBlank()
                        )
                        .isPresent();

        boolean mercadoPagoCardReady =
                mercadoPagoConnection
                        .filter(
                                connection ->
                                        connection.getAccessToken() != null &&
                                        !connection.getAccessToken()
                                                .isBlank() &&
                                        connection.getPublicKey() != null &&
                                        !connection.getPublicKey()
                                                .isBlank()
                        )
                        .isPresent();

        boolean stripeReady =
                stripeStorePaymentService
                        .isReady(
                                targetStore.getId()
                        );

        boolean payPalReady =
                payPalStorePaymentService
                        .isReady(
                                targetStore.getId()
                        );

        boolean stripeWalletReady =
                !brazil &&
                stripeStorePaymentService
                        .isWalletReady(
                                targetStore.getId()
                        );

        String stripePublishableKey =
                stripeWalletReady
                        ? stripeStorePaymentService
                                .getPublishableKey(
                                        targetStore.getId()
                                )
                        : null;

        String provider =
                brazil
                        ? "MERCADO_PAGO"
                        : "MULTIPLE";

        boolean ready =
                true;

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "provider",
                provider
        );

        response.put(
                "ready",
                ready
        );

        response.put(
                "pixAvailable",
                brazil &&
                        mercadoPagoReady
        );

        response.put(
                "cardAvailable",
                brazil
                        ? mercadoPagoCardReady
                        : stripeReady
        );

        response.put(
                "stripeAvailable",
                !brazil &&
                        stripeReady
        );

        response.put(
                "stripeWalletAvailable",
                stripeWalletReady
        );

        response.put(
                "stripePublishableKey",
                stripePublishableKey
        );

        response.put(
                "paypalAvailable",
                !brazil &&
                        payPalReady
        );

        response.put(
                "cashAvailable",
                true
        );

        response.put(
                "hostedCheckout",
                !brazil &&
                        stripeReady
        );

        response.put(
                "countryCode",
                targetStore.getCountryCode()
        );

        response.put(
                "currencyCode",
                targetStore.getCurrencyCode()
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // CRIAR CHECKOUT STRIPE
    // =========================

    @PostMapping("/{orderId}/stripe/checkout")
    public ResponseEntity<?> createStripeCheckout(
            @PathVariable Long orderId,
            @RequestParam String token,
            @RequestBody(required = false)
            StripeCheckoutRequest request
    ) {

        Order order =
                getOrderForToken(
                        orderId,
                        token
                );

        String returnOrigin =
                request != null
                        ? request.returnOrigin()
                        : null;

        StripeStorePaymentService.StripeCheckoutSession session =
                stripeStorePaymentService
                        .createCheckoutSession(
                                order,
                                token,
                                returnOrigin
                        );

        return ResponseEntity.ok(
                Map.of(
                        "id",
                        session.id(),
                        "url",
                        session.url(),
                        "status",
                        session.status() == null
                                ? ""
                                : session.status(),
                        "paymentStatus",
                        session.paymentStatus() == null
                                ? ""
                                : session.paymentStatus()
                )
        );
    }

    @PostMapping("/{orderId}/stripe/wallet-intent")
    public ResponseEntity<?> createStripeWalletIntent(
            @PathVariable Long orderId,
            @RequestParam String token
    ) {
        Order order =
                getOrderForToken(
                        orderId,
                        token
                );

        StripeStorePaymentService.StripeWalletIntent intent =
                stripeStorePaymentService
                        .createWalletPaymentIntent(
                                order
                        );

        return ResponseEntity.ok(
                Map.of(
                        "id",
                        intent.id(),
                        "clientSecret",
                        intent.clientSecret(),
                        "status",
                        intent.status() == null
                                ? ""
                                : intent.status()
                )
        );
    }

    @PostMapping("/{orderId}/stripe/wallet-sync")
    public ResponseEntity<?> syncStripeWalletIntent(
            @PathVariable Long orderId,
            @RequestParam String token,
            @RequestParam String paymentIntentId
    ) {
        Order order =
                getOrderForToken(
                        orderId,
                        token
                );

        Order synced =
                stripeStorePaymentService
                        .syncWalletPaymentIntent(
                                order,
                                paymentIntentId
                        );

        return ResponseEntity.ok(
                Map.of(
                        "orderId",
                        synced.getId(),
                        "paymentStatus",
                        synced.getPaymentStatus()
                                .name(),
                        "orderStatus",
                        synced.getStatus()
                                .name()
                )
        );
    }

    // =========================
    // SINCRONIZAR RETORNO
    // =========================

    @PostMapping("/{orderId}/stripe/sync")
    public ResponseEntity<?> syncStripeCheckout(
            @PathVariable Long orderId,
            @RequestParam String token,
            @RequestParam String sessionId
    ) {

        Order order =
                getOrderForToken(
                        orderId,
                        token
                );

        Order synced =
                stripeStorePaymentService
                        .syncCheckoutSession(
                                order,
                                sessionId
                        );

        return ResponseEntity.ok(
                Map.of(
                        "orderId",
                        synced.getId(),
                        "paymentStatus",
                        synced.getPaymentStatus()
                                .name(),
                        "orderStatus",
                        synced.getStatus()
                                .name()
                )
        );
    }

    // =========================
    // WEBHOOK DA LOJA
    // =========================

    @PostMapping("/stripe/webhook/{storeId}")
    public ResponseEntity<Void> stripeWebhook(
            @PathVariable Long storeId,
            @RequestBody String body,
            @RequestHeader(
                    value = "Stripe-Signature",
                    required = false
            )
            String stripeSignature
    ) {

        try {
            stripeStorePaymentService
                    .handleWebhook(
                            storeId,
                            body,
                            stripeSignature
                    );

            return ResponseEntity
                    .ok()
                    .build();

        } catch (
                SecurityException exception
        ) {
            return ResponseEntity
                    .status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .build();

        } catch (
                IllegalArgumentException exception
        ) {
            return ResponseEntity
                    .badRequest()
                    .build();
        }
    }

    // =========================
    // ACESSO AO PEDIDO
    // =========================

    private Order getOrderForToken(
            Long orderId,
            String token
    ) {

        Order order =
                orderRepository
                        .findById(
                                orderId
                        )
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
                !constantTimeEquals(
                        token,
                        order.getPublicAccessToken()
                )
        ) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Pedido não encontrado."
            );
        }

        return order;
    }

    private boolean constantTimeEquals(
            String first,
            String second
    ) {

        return MessageDigest.isEqual(
                first.getBytes(
                        StandardCharsets.UTF_8
                ),
                second.getBytes(
                        StandardCharsets.UTF_8
                )
        );
    }

    public record StripeCheckoutRequest(
            String returnOrigin
    ) {
    }
}
