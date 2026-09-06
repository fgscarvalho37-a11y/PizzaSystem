package com.pizzasystem.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MercadoPagoService {

    @Value("${mercadopago.access-token}")
    private String accessToken;

    private final RestTemplate restTemplate;

    public MercadoPagoService() {
        this.restTemplate = new RestTemplate();
    }

    // =========================
    // PIX
    // =========================

    public MercadoPagoResult createPixOrder(
            Long orderId,
            BigDecimal amount
    ) {

        Map<String, Object> paymentMethod =
                new HashMap<>();

        paymentMethod.put(
                "id",
                "pix"
        );

        paymentMethod.put(
                "type",
                "bank_transfer"
        );

        Map<String, Object> payment =
                new HashMap<>();

        payment.put(
                "amount",
                amount.toPlainString()
        );

        payment.put(
                "payment_method",
                paymentMethod
        );

        return createOrder(
                orderId,
                amount,
                "test@testuser.com",
                null,
                null,
                payment
        );
    }

    // =========================
    // CARTÃO
    // =========================

    public MercadoPagoResult createCardOrder(
            Long orderId,
            BigDecimal amount,
            String token,
            String paymentMethodId,
            boolean debit,
            Integer installments,
            String email,
            String identificationType,
            String identificationNumber
    ) {

        String finalPaymentMethodId =
                paymentMethodId;

        String paymentType;

        if (debit) {

            if ("elo".equalsIgnoreCase(
                    paymentMethodId
            )
                    || "debelo".equalsIgnoreCase(
                            paymentMethodId
                    )) {

                finalPaymentMethodId =
                        "debelo";
            }

            paymentType =
                    "debit_card";

        } else {

            paymentType =
                    "credit_card";
        }

        System.out.println(
                "Tipo de cartão do pedido: "
                        + paymentType
        );

        System.out.println(
                "Payment Method enviado: "
                        + finalPaymentMethodId
        );

        Map<String, Object> paymentMethod =
                new HashMap<>();

        paymentMethod.put(
                "id",
                finalPaymentMethodId
        );

        paymentMethod.put(
                "type",
                paymentType
        );

        paymentMethod.put(
                "token",
                token
        );

        if (!debit) {

            paymentMethod.put(
                    "installments",
                    installments != null
                            && installments > 0
                            ? installments
                            : 1
            );
        }

        Map<String, Object> payment =
                new HashMap<>();

        payment.put(
                "amount",
                amount.toPlainString()
        );

        payment.put(
                "payment_method",
                paymentMethod
        );

        return createOrder(
                orderId,
                amount,
                email,
                identificationType,
                identificationNumber,
                payment
        );
    }

    // =========================
    // CRIAR ORDER
    // =========================

    private MercadoPagoResult createOrder(
            Long orderId,
            BigDecimal amount,
            String email,
            String identificationType,
            String identificationNumber,
            Map<String, Object> payment
    ) {

        String url =
                "https://api.mercadopago.com/v1/orders";

        Map<String, Object> payer =
                new HashMap<>();

        payer.put(
                "email",
                email
        );

        if (identificationType != null
                && !identificationType.isBlank()
                && identificationNumber != null
                && !identificationNumber.isBlank()) {

            Map<String, Object> identification =
                    new HashMap<>();

            identification.put(
                    "type",
                    identificationType
            );

            identification.put(
                    "number",
                    identificationNumber
            );

            payer.put(
                    "identification",
                    identification
            );
        }

        Map<String, Object> transactions =
                new HashMap<>();

        transactions.put(
                "payments",
                List.of(payment)
        );

        Map<String, Object> body =
                new HashMap<>();

        body.put(
                "type",
                "online"
        );

        body.put(
                "processing_mode",
                "automatic"
        );

        body.put(
                "total_amount",
                amount.toPlainString()
        );

        body.put(
                "external_reference",
                "pizzasystem-order-" + orderId
        );

        body.put(
                "payer",
                payer
        );

        body.put(
                "transactions",
                transactions
        );

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.setBearerAuth(
                accessToken
        );

        headers.set(
                "X-Idempotency-Key",
                UUID.randomUUID().toString()
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(
                        body,
                        headers
                );

        try {

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            request,
                            String.class
                    );

            return new MercadoPagoResult(
                    response.getStatusCode().value(),
                    response.getBody()
            );

        } catch (HttpStatusCodeException e) {

            System.out.println(
                    "Mercado Pago HTTP: "
                            + e.getStatusCode()
            );

            System.out.println(
                    "Mercado Pago BODY: "
                            + e.getResponseBodyAsString()
            );

            return new MercadoPagoResult(
                    e.getStatusCode().value(),
                    e.getResponseBodyAsString()
            );
        }
    }

    // =========================
    // CONSULTAR ORDER
    // =========================

    public String getOrder(
            String mercadoPagoOrderId
    ) {

        String url =
                "https://api.mercadopago.com/v1/orders/"
                        + mercadoPagoOrderId;

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                accessToken
        );

        HttpEntity<Void> request =
                new HttpEntity<>(
                        headers
                );

        try {

            ResponseEntity<String> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.GET,
                            request,
                            String.class
                    );

            return response.getBody();

        } catch (HttpStatusCodeException e) {

            System.out.println(
                    "Mercado Pago HTTP: "
                            + e.getStatusCode()
            );

            System.out.println(
                    "Mercado Pago BODY: "
                            + e.getResponseBodyAsString()
            );

            throw new RuntimeException(
                    "Erro Mercado Pago: "
                            + e.getStatusCode()
                            + " - "
                            + e.getResponseBodyAsString(),
                    e
            );
        }
    }

    // =========================
    // RESULTADO DA API
    // =========================

    public static class MercadoPagoResult {

        private final int statusCode;
        private final String body;

        public MercadoPagoResult(
                int statusCode,
                String body
        ) {
            this.statusCode =
                    statusCode;

            this.body =
                    body;
        }

        public int getStatusCode() {
            return statusCode;
        }

        public String getBody() {
            return body;
        }
    }
}