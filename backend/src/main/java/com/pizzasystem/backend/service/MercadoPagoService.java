package com.pizzasystem.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    private static final Logger logger =
            LoggerFactory.getLogger(
                    MercadoPagoService.class
            );

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${mercadopago.pix-payer-email:test_user_br@testuser.com}")
    private String pixPayerEmail;

    @Value("${mercadopago.test-auto-approve-pix:false}")
    private boolean testAutoApprovePix;

    private final RestTemplate restTemplate;

    public MercadoPagoService() {
        this.restTemplate =
                new RestTemplate();
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
                pixPayerEmail,
                null,
                null,
                payment,
                true
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
                payment,
                false
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
            Map<String, Object> payment,
            boolean pix
    ) {

        String url =
                "https://api.mercadopago.com/v1/orders";

        Map<String, Object> payer =
                new HashMap<>();

        if (email != null
                && !email.isBlank()) {

            payer.put(
                    "email",
                    email.trim()
            );
        }

        // =========================
        // AUTO APROVAÇÃO PIX TESTE
        // =========================

        /*
         * Somente para ambiente de teste.
         *
         * true:
         * Mercado Pago recebe first_name = APRO
         * e simula aprovação automática.
         *
         * false:
         * Pix permanece pendente para permitir
         * testar QR Code, expiração e cancelamento.
         */
        if (pix
                && testAutoApprovePix
                && "test_user_br@testuser.com"
                .equalsIgnoreCase(
                        email != null
                                ? email.trim()
                                : ""
                )) {

            payer.put(
                    "first_name",
                    "APRO"
            );
        }

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
                List.of(
                        payment
                )
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
                "pizzasystem-order-"
                        + orderId
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
                createHeaders();

        headers.set(
                "X-Idempotency-Key",
                UUID.randomUUID()
                        .toString()
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

            logger.info(
                    "Mercado Pago order criada para pedido {} com HTTP {}.",
                    orderId,
                    response
                            .getStatusCode()
                            .value()
            );

            return new MercadoPagoResult(
                    response
                            .getStatusCode()
                            .value(),
                    response.getBody()
            );

        } catch (HttpStatusCodeException e) {

            String responseBody =
                    e.getResponseBodyAsString();

            logger.warn(
                    "Mercado Pago recusou criação da order do pedido {}. HTTP {}. Resposta: {}",
                    orderId,
                    e.getStatusCode()
                            .value(),
                    responseBody
            );

            return new MercadoPagoResult(
                    e.getStatusCode()
                            .value(),
                    responseBody
            );
        }
    }

    // =========================
    // CONSULTAR ORDER
    // =========================

    public String getOrder(
            String mercadoPagoOrderId
    ) {

        if (mercadoPagoOrderId == null
                || mercadoPagoOrderId.isBlank()) {

            throw new IllegalArgumentException(
                    "ID da order do Mercado Pago não informado."
            );
        }

        String url =
                "https://api.mercadopago.com/v1/orders/"
                        + mercadoPagoOrderId;

        HttpHeaders headers =
                createHeaders();

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

            logger.warn(
                    "Falha ao consultar order do Mercado Pago. HTTP {}.",
                    e.getStatusCode()
                            .value()
            );

            throw new RuntimeException(
                    "Não foi possível consultar o pagamento no Mercado Pago.",
                    e
            );
        }
    }

    // =========================
    // HEADERS
    // =========================

    private HttpHeaders createHeaders() {

        if (accessToken == null
                || accessToken.isBlank()) {

            throw new IllegalStateException(
                    "MERCADOPAGO_ACCESS_TOKEN não configurado."
            );
        }

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
        );

        headers.setBearerAuth(
                accessToken.trim()
        );

        return headers;
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