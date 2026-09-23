package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Order;

import com.pizzasystem.backend.repository.OrderRepository;

import com.pizzasystem.backend.service.MercadoPagoOAuthService;

import org.springframework.http.HttpStatus;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class MercadoPagoPublicKeyController {

    private final OrderRepository
            orderRepository;

    private final MercadoPagoOAuthService
            mercadoPagoOAuthService;

    public MercadoPagoPublicKeyController(
            OrderRepository orderRepository,
            MercadoPagoOAuthService mercadoPagoOAuthService
    ) {
        this.orderRepository =
                orderRepository;

        this.mercadoPagoOAuthService =
                mercadoPagoOAuthService;
    }

    // =========================
    // PUBLIC KEY DA LOJA
    // DO PEDIDO
    // =========================

    @GetMapping("/{orderId}/public-key")
    public Map<String, String> getPublicKey(
            @PathVariable Long orderId,
            @RequestParam String token
    ) {

        if (token == null
                || token.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Pedido não encontrado."
            );
        }

        Order order =
                orderRepository
                        .findByIdAndPublicAccessToken(
                                orderId,
                                token.trim()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Pedido não encontrado."
                                )
                        );

        if (order.getStore() == null
                || order.getStore().getId() == null) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Loja do pedido não encontrada."
            );
        }

        String publicKey;

        try {

            publicKey =
                    mercadoPagoOAuthService
                            .getPublicKeyForStore(
                                    order
                                            .getStore()
                                            .getId()
                            );

        } catch (IllegalStateException exception) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    exception.getMessage()
            );
        }

        Map<String, String> response =
                new HashMap<>();

        response.put(
                "publicKey",
                publicKey
        );

        return response;
    }
}