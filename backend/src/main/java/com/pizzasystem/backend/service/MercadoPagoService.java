package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Order;

import com.pizzasystem.backend.repository.OrderRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

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

    private final OrderRepository
            orderRepository;

    private final MercadoPagoOAuthService
            mercadoPagoOAuthService;

    private final RestTemplate
            restTemplate;

    @Value("${mercadopago.pix-payer-email:test_user_br@testuser.com}")
    private String pixPayerEmail;

    @Value("${mercadopago.test-auto-approve-pix:false}")
    private boolean testAutoApprovePix;

    public MercadoPagoService(
            OrderRepository orderRepository,
            MercadoPagoOAuthService mercadoPagoOAuthService
    ) {

        this.orderRepository =
                orderRepository;

        this.mercadoPagoOAuthService =
                mercadoPagoOAuthService;

        this.restTemplate =
                new RestTemplate();
    }

    // =========================
    // PIX
    // =========================

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
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

        String paymentType =
                debit
                        ? "debit_card"
                        : "credit_card";

        Map<String, Object> paymentMethod =
                new HashMap<>();

        paymentMethod.put(
                "id",
                paymentMethodId
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
    // CRIAR ORDER NO MP
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

        if (orderId == null) {

            throw new IllegalArgumentException(
                    "Pedido não informado."
            );
        }

        if (amount == null
                || amount.compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            throw new IllegalArgumentException(
                    "Valor do pagamento inválido."
            );
        }

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
                    identificationType.trim()
            );

            identification.put(
                    "number",
                    identificationNumber.trim()
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

        /*
         * Aqui está a mudança principal:
         *
         * o Access Token NÃO vem mais de
         * mercadopago.access-token global.
         *
         * Descobrimos a loja pelo pedido e usamos
         * o token OAuth daquela loja.
         */
        HttpHeaders headers =
                createHeadersForOrder(
                        orderId
                );

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

        } catch (HttpStatusCodeException exception) {

            String responseBody =
                    exception
                            .getResponseBodyAsString();

            logger.warn(
                    "Mercado Pago recusou criação da order do pedido {}. HTTP {}. Resposta: {}",
                    orderId,
                    exception
                            .getStatusCode()
                            .value(),
                    responseBody
            );

            return new MercadoPagoResult(
                    exception
                            .getStatusCode()
                            .value(),
                    responseBody
            );
        }
    }

    // =========================
    // CONSULTAR ORDER DO MP
    // =========================

    @Transactional(readOnly = true)
    public String getOrder(
            String mercadoPagoOrderId
    ) {

        if (mercadoPagoOrderId == null
                || mercadoPagoOrderId.isBlank()) {

            throw new IllegalArgumentException(
                    "ID da order do Mercado Pago não informado."
            );
        }

        String normalizedExternalId =
                mercadoPagoOrderId.trim();

        String url =
                "https://api.mercadopago.com/v1/orders/"
                        + normalizedExternalId;

        /*
         * Para consultar um pagamento já criado,
         * localizamos o pedido pelo paymentExternalId
         * e novamente usamos o Access Token da loja
         * dona daquele pedido.
         */
        HttpHeaders headers =
                createHeadersForExternalPayment(
                        normalizedExternalId
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

        } catch (HttpStatusCodeException exception) {

            logger.warn(
                    "Falha ao consultar order do Mercado Pago {}. HTTP {}.",
                    normalizedExternalId,
                    exception
                            .getStatusCode()
                            .value()
            );

            throw new RuntimeException(
                    "Não foi possível consultar o pagamento no Mercado Pago.",
                    exception
            );
        }
    }

    // =========================
    // HEADERS POR PEDIDO
    // =========================

    private HttpHeaders createHeadersForOrder(
            Long orderId
    ) {

        Order order =
                orderRepository
                        .findById(
                                orderId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Pedido não encontrado."
                                )
                        );

        Long storeId =
                getStoreId(
                        order
                );

        String accessToken =
                mercadoPagoOAuthService
                        .getAccessTokenForStore(
                                storeId
                        );

        return createHeaders(
                accessToken
        );
    }

    // =========================
    // HEADERS POR PAGAMENTO
    // =========================

    private HttpHeaders createHeadersForExternalPayment(
            String mercadoPagoOrderId
    ) {

        Order order =
                orderRepository
                        .findByPaymentExternalId(
                                mercadoPagoOrderId
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Pagamento não está vinculado a um pedido local."
                                )
                        );

        Long storeId =
                getStoreId(
                        order
                );

        String accessToken =
                mercadoPagoOAuthService
                        .getAccessTokenForStore(
                                storeId
                        );

        return createHeaders(
                accessToken
        );
    }

    // =========================
    // STORE DO PEDIDO
    // =========================

    private Long getStoreId(
            Order order
    ) {

        if (order == null
                || order.getStore() == null
                || order.getStore().getId() == null) {

            throw new IllegalStateException(
                    "Loja do pedido não encontrada."
            );
        }

        return order
                .getStore()
                .getId();
    }

    // =========================
    // HEADERS
    // =========================

    private HttpHeaders createHeaders(
            String accessToken
    ) {

        if (accessToken == null
                || accessToken.isBlank()) {

            throw new IllegalStateException(
                    "Access Token do Mercado Pago não disponível."
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
