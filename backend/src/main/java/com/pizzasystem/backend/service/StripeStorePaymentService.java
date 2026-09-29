package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.entity.StripePaymentConnection;

import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.StripePaymentConnectionRepository;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.net.URI;

import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;

import java.time.Instant;
import java.time.LocalDateTime;

import java.util.Currency;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class StripeStorePaymentService {

    private static final String API_BASE =
            "https://api.stripe.com/v1";

    private static final long WEBHOOK_TOLERANCE_SECONDS =
            300L;

    private final StripePaymentConnectionRepository
            connectionRepository;

    private final OrderRepository
            orderRepository;

    private final CredentialEncryptionService
            encryptionService;

    private final CouponService
            couponService;

    private final LoyaltyService
            loyaltyService;

    private final RestTemplate
            restTemplate =
            new RestTemplate();

    private final ObjectMapper
            objectMapper =
            new ObjectMapper();

    @Value(
            "${PIZZASYSTEM_PUBLIC_API_URL:https://pizzasystem-api.onrender.com}"
    )
    private String publicApiUrl;

    public StripeStorePaymentService(
            StripePaymentConnectionRepository connectionRepository,
            OrderRepository orderRepository,
            CredentialEncryptionService encryptionService,
            CouponService couponService,
            LoyaltyService loyaltyService
    ) {
        this.connectionRepository =
                connectionRepository;

        this.orderRepository =
                orderRepository;

        this.encryptionService =
                encryptionService;

        this.couponService =
                couponService;

        this.loyaltyService =
                loyaltyService;
    }

    // =========================
    // STATUS / CONFIGURAÇÃO
    // =========================

    @Transactional(readOnly = true)
    public Map<String, Object> getConnectionStatus(
            Store store
    ) {

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElse(
                                null
                        );

        boolean connected =
                connection != null &&
                connection.isConnected() &&
                hasText(
                        connection.getRestrictedApiKeyEncrypted()
                ) &&
                hasText(
                        connection.getWebhookSecretEncrypted()
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "connected",
                connected
        );

        response.put(
                "provider",
                "STRIPE"
        );

        response.put(
                "countryCode",
                store.getCountryCode()
        );

        response.put(
                "currencyCode",
                store.getCurrencyCode()
        );

        response.put(
                "recommended",
                !"BR".equalsIgnoreCase(
                        store.getCountryCode()
                )
        );

        response.put(
                "keyLast4",
                connection != null
                        ? connection.getKeyLast4()
                        : null
        );

        response.put(
                "publishableKeyLast4",
                connection != null &&
                        hasText(
                                connection.getPublishableKey()
                        )
                        ? connection.getPublishableKey()
                                .substring(
                                        Math.max(
                                                0,
                                                connection.getPublishableKey()
                                                        .length() - 4
                                        )
                                )
                        : null
        );

        response.put(
                "walletsReady",
                connected &&
                        connection != null &&
                        hasText(
                                connection.getPublishableKey()
                        )
        );

        response.put(
                "connectedAt",
                connection != null
                        ? connection.getConnectedAt()
                        : null
        );

        String webhookPath =
                "/api/payments/stripe/webhook/"
                        + store.getId();

        response.put(
                "webhookPath",
                webhookPath
        );

        response.put(
                "webhookUrl",
                normalizePublicApiUrl(
                        publicApiUrl
                )
                        + webhookPath
        );

        return response;
    }

    @Transactional
    public Map<String, Object> connect(
            Store store,
            String restrictedApiKey,
            String webhookSecret,
            String publishableKey
    ) {

        String apiKey =
                normalizeRestrictedApiKey(
                        restrictedApiKey
                );

        String secret =
                normalizeWebhookSecret(
                        webhookSecret
                );

        String publicKey =
                normalizePublishableKey(
                        publishableKey
                );

        validateRestrictedApiKey(
                apiKey
        );

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElseGet(
                                StripePaymentConnection::new
                        );

        connection.setStore(
                store
        );

        connection.setRestrictedApiKeyEncrypted(
                encryptionService.encrypt(
                        apiKey
                )
        );

        connection.setWebhookSecretEncrypted(
                encryptionService.encrypt(
                        secret
                )
        );

        connection.setPublishableKey(
                publicKey
        );

        connection.setKeyLast4(
                apiKey.substring(
                        apiKey.length() - 4
                )
        );

        connection.setConnected(
                true
        );

        connection.setConnectedAt(
                LocalDateTime.now()
        );

        connection.setDisconnectedAt(
                null
        );

        connectionRepository.save(
                connection
        );

        return getConnectionStatus(
                store
        );
    }

    @Transactional
    public void disconnect(
            Store store
    ) {

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElse(
                                null
                        );

        if (connection == null) {
            return;
        }

        connection.setRestrictedApiKeyEncrypted(
                null
        );

        connection.setWebhookSecretEncrypted(
                null
        );

        connection.setPublishableKey(
                null
        );

        connection.setKeyLast4(
                null
        );

        connection.setConnected(
                false
        );

        connection.setDisconnectedAt(
                LocalDateTime.now()
        );

        connectionRepository.save(
                connection
        );
    }

    @Transactional(readOnly = true)
    public boolean isReady(
            Long storeId
    ) {

        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .filter(
                        connection ->
                                hasText(
                                        connection.getRestrictedApiKeyEncrypted()
                                ) &&
                                hasText(
                                        connection.getWebhookSecretEncrypted()
                                )
                )
                .isPresent();
    }

    @Transactional(readOnly = true)
    public boolean isWalletReady(
            Long storeId
    ) {
        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .filter(
                        connection ->
                                hasText(
                                        connection.getRestrictedApiKeyEncrypted()
                                ) &&
                                hasText(
                                        connection.getWebhookSecretEncrypted()
                                ) &&
                                hasText(
                                        connection.getPublishableKey()
                                )
                )
                .isPresent();
    }

    @Transactional(readOnly = true)
    public String getPublishableKey(
            Long storeId
    ) {
        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .map(
                        StripePaymentConnection::getPublishableKey
                )
                .filter(
                        this::hasText
                )
                .orElse(
                        null
                );
    }

    @Transactional
    public StripeWalletIntent createWalletPaymentIntent(
            Order order
    ) {
        validateOrderForStripe(
                order
        );

        if (
                !isWalletReady(
                        order.getStore()
                                .getId()
                )
        ) {
            throw new IllegalStateException(
                    "Apple Pay e Google Pay ainda não foram configurados para esta loja."
            );
        }

        if (
                order.getPaymentStatus() ==
                        PaymentStatus.APPROVED
        ) {
            throw new IllegalStateException(
                    "Este pedido já foi pago."
            );
        }

        Store store =
                order.getStore();

        String currency =
                normalizeCurrency(
                        hasText(
                                order.getPaymentCurrencyCode()
                        )
                                ? order.getPaymentCurrencyCode()
                                : store.getCurrencyCode()
                );

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "amount",
                String.valueOf(
                        toMinorUnits(
                                order.getTotal(),
                                currency
                        )
                )
        );

        form.add(
                "currency",
                currency.toLowerCase(
                        Locale.ROOT
                )
        );

        form.add(
                "payment_method_types[0]",
                "card"
        );

        form.add(
                "metadata[order_id]",
                String.valueOf(
                        order.getId()
                )
        );

        form.add(
                "metadata[store_id]",
                String.valueOf(
                        store.getId()
                )
        );

        form.add(
                "description",
                store.getName()
                        + " - Order #"
                        + order.getId()
        );

        JsonNode response =
                postForm(
                        "/payment_intents",
                        form,
                        getRestrictedApiKey(
                                store.getId()
                        )
                );

        String paymentIntentId =
                response.path(
                        "id"
                )
                        .asText();

        String clientSecret =
                response.path(
                        "client_secret"
                )
                        .asText();

        String status =
                response.path(
                        "status"
                )
                        .asText();

        if (
                !hasText(
                        paymentIntentId
                ) ||
                !hasText(
                        clientSecret
                )
        ) {
            throw new IllegalStateException(
                    "A Stripe não retornou um PaymentIntent válido."
            );
        }

        order.setPaymentExternalId(
                paymentIntentId
        );

        order.setPaymentProvider(
                "STRIPE"
        );

        order.setPaymentCurrencyCode(
                currency
        );

        orderRepository.save(
                order
        );

        return new StripeWalletIntent(
                paymentIntentId,
                clientSecret,
                status
        );
    }

    @Transactional
    public Order syncWalletPaymentIntent(
            Order order,
            String paymentIntentId
    ) {
        validateOrderForStripe(
                order
        );

        if (
                paymentIntentId == null ||
                !paymentIntentId.matches(
                        "^pi_[A-Za-z0-9_]+$"
                )
        ) {
            throw new IllegalArgumentException(
                    "PaymentIntent Stripe inválido."
            );
        }

        JsonNode intent =
                getPaymentIntent(
                        order.getStore()
                                .getId(),
                        paymentIntentId
                );

        validateSessionOwnership(
                order,
                intent
        );

        String status =
                intent.path(
                        "status"
                )
                        .asText();

        if (
                "succeeded".equalsIgnoreCase(
                        status
                )
        ) {
            order.setPaymentExternalId(
                    paymentIntentId
            );

            approveOrder(
                    order
            );

        } else if (
                "canceled".equalsIgnoreCase(
                        status
                ) &&
                order.getPaymentStatus() !=
                        PaymentStatus.APPROVED
        ) {
            order.setPaymentStatus(
                    PaymentStatus.REJECTED
            );

            orderRepository.save(
                    order
            );
        }

        return order;
    }

    // =========================
    // CHECKOUT
    // =========================

    @Transactional
    public StripeCheckoutSession createCheckoutSession(
            Order order,
            String publicAccessToken,
            String returnOrigin
    ) {

        validateOrderForStripe(
                order
        );

        if (
                order.getPaymentStatus()
                        == PaymentStatus.APPROVED
        ) {
            throw new IllegalStateException(
                    "Este pedido já foi pago."
            );
        }

        String existingExternalId =
                order.getPaymentExternalId();

        if (
                hasText(
                        existingExternalId
                ) &&
                existingExternalId.startsWith(
                        "cs_"
                )
        ) {
            try {
                JsonNode existing =
                        getCheckoutSession(
                                order.getStore()
                                        .getId(),
                                existingExternalId
                        );

                String status =
                        existing.path(
                                "status"
                        )
                                .asText();

                String paymentStatus =
                        existing.path(
                                "payment_status"
                        )
                                .asText();

                if (
                        "complete".equalsIgnoreCase(
                                status
                        ) &&
                        "paid".equalsIgnoreCase(
                                paymentStatus
                        )
                ) {
                    approveOrder(
                            order
                    );
                }

                String existingUrl =
                        existing.path(
                                "url"
                        )
                                .asText();

                if (
                        "open".equalsIgnoreCase(
                                status
                        ) &&
                        hasText(
                                existingUrl
                        )
                ) {
                    return new StripeCheckoutSession(
                            existingExternalId,
                            existingUrl,
                            status,
                            paymentStatus
                    );
                }

            } catch (
                    RuntimeException ignored
            ) {
                // Cria uma nova sessão se a anterior já não estiver utilizável.
            }
        }

        Store store =
                order.getStore();

        String apiKey =
                getRestrictedApiKey(
                        store.getId()
                );

        String origin =
                normalizeReturnOrigin(
                        returnOrigin
                );

        String token =
                java.net.URLEncoder.encode(
                        publicAccessToken,
                        StandardCharsets.UTF_8
                );

        String slug =
                java.net.URLEncoder.encode(
                        store.getSlug(),
                        StandardCharsets.UTF_8
                );

        String successUrl =
                origin
                        + "/pagamento/sucesso/"
                        + order.getId()
                        + "?token="
                        + token
                        + "&store="
                        + slug
                        + "&stripe=success"
                        + "&session_id={CHECKOUT_SESSION_ID}";

        String cancelUrl =
                origin
                        + "/pagamento/stripe/"
                        + order.getId()
                        + "?token="
                        + token
                        + "&store="
                        + slug
                        + "&cancelled=1";

        String currency =
                normalizeCurrency(
                        hasText(
                                order.getPaymentCurrencyCode()
                        )
                                ? order.getPaymentCurrencyCode()
                                : store.getCurrencyCode()
                );

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "mode",
                "payment"
        );

        form.add(
                "success_url",
                successUrl
        );

        form.add(
                "cancel_url",
                cancelUrl
        );

        form.add(
                "client_reference_id",
                String.valueOf(
                        order.getId()
                )
        );

        form.add(
                "locale",
                "auto"
        );

        form.add(
                "line_items[0][quantity]",
                "1"
        );

        form.add(
                "line_items[0][price_data][currency]",
                currency.toLowerCase(
                        Locale.ROOT
                )
        );

        form.add(
                "line_items[0][price_data][unit_amount]",
                String.valueOf(
                        toMinorUnits(
                                order.getTotal(),
                                currency
                        )
                )
        );

        form.add(
                "line_items[0][price_data][product_data][name]",
                store.getName()
                        + " - Order #"
                        + order.getId()
        );

        form.add(
                "metadata[order_id]",
                String.valueOf(
                        order.getId()
                )
        );

        form.add(
                "metadata[store_id]",
                String.valueOf(
                        store.getId()
                )
        );

        form.add(
                "payment_intent_data[metadata][order_id]",
                String.valueOf(
                        order.getId()
                )
        );

        form.add(
                "payment_intent_data[metadata][store_id]",
                String.valueOf(
                        store.getId()
                )
        );

        JsonNode response =
                postForm(
                        "/checkout/sessions",
                        form,
                        apiKey
                );

        String sessionId =
                response.path(
                        "id"
                )
                        .asText();

        String url =
                response.path(
                        "url"
                )
                        .asText();

        if (
                !hasText(
                        sessionId
                ) ||
                !hasText(
                        url
                )
        ) {
            throw new IllegalStateException(
                    "A Stripe não retornou uma sessão de pagamento válida."
            );
        }

        order.setPaymentExternalId(
                sessionId
        );

        order.setPaymentProvider(
                "STRIPE"
        );

        order.setPaymentCurrencyCode(
                currency
        );

        orderRepository.save(
                order
        );

        return new StripeCheckoutSession(
                sessionId,
                url,
                response.path(
                        "status"
                )
                        .asText(),
                response.path(
                        "payment_status"
                )
                        .asText()
        );
    }

    @Transactional
    public Order syncCheckoutSession(
            Order order,
            String sessionId
    ) {

        validateOrderForStripe(
                order
        );

        if (
                sessionId == null ||
                !sessionId.matches(
                        "^cs_[A-Za-z0-9_]+$"
                )
        ) {
            throw new IllegalArgumentException(
                    "Sessão Stripe inválida."
            );
        }

        JsonNode session =
                getCheckoutSession(
                        order.getStore()
                                .getId(),
                        sessionId
                );

        validateSessionOwnership(
                order,
                session
        );

        String status =
                session.path(
                        "status"
                )
                        .asText();

        String paymentStatus =
                session.path(
                        "payment_status"
                )
                        .asText();

        if (
                "complete".equalsIgnoreCase(
                        status
                ) &&
                (
                        "paid".equalsIgnoreCase(
                                paymentStatus
                        ) ||
                        "no_payment_required".equalsIgnoreCase(
                                paymentStatus
                        )
                )
        ) {
            approveOrder(
                    order
            );

        } else if (
                "expired".equalsIgnoreCase(
                        status
                ) &&
                order.getPaymentStatus()
                        != PaymentStatus.APPROVED
        ) {
            order.setPaymentStatus(
                    PaymentStatus.REJECTED
            );

            orderRepository.save(
                    order
            );
        }

        return order;
    }

    // =========================
    // WEBHOOK
    // =========================

    @Transactional
    public void handleWebhook(
            Long storeId,
            String payload,
            String signatureHeader
    ) {

        String webhookSecret =
                getWebhookSecret(
                        storeId
                );

        if (
                !verifyWebhookSignature(
                        payload,
                        signatureHeader,
                        webhookSecret
                )
        ) {
            throw new SecurityException(
                    "Assinatura Stripe inválida."
            );
        }

        JsonNode event;

        try {
            event =
                    objectMapper.readTree(
                            payload
                    );

        } catch (Exception exception) {
            throw new IllegalArgumentException(
                    "Webhook Stripe inválido.",
                    exception
            );
        }

        String type =
                event.path(
                        "type"
                )
                        .asText();

        JsonNode session =
                event.path(
                        "data"
                )
                        .path(
                                "object"
                        );

        if (
                type.startsWith(
                        "payment_intent."
                )
        ) {
            Long walletOrderId =
                    parseLong(
                            session.path(
                                    "metadata"
                            )
                                    .path(
                                            "order_id"
                                    )
                                    .asText()
                    );

            Long walletStoreId =
                    parseLong(
                            session.path(
                                    "metadata"
                            )
                                    .path(
                                            "store_id"
                                    )
                                    .asText()
                    );

            if (
                    walletOrderId == null ||
                    walletStoreId == null ||
                    !storeId.equals(
                            walletStoreId
                    )
            ) {
                return;
            }

            Order walletOrder =
                    orderRepository
                            .findById(
                                    walletOrderId
                            )
                            .orElse(
                                    null
                            );

            if (
                    walletOrder == null ||
                    walletOrder.getStore() == null ||
                    !storeId.equals(
                            walletOrder.getStore()
                                    .getId()
                    )
            ) {
                return;
            }

            validateSessionOwnership(
                    walletOrder,
                    session
            );

            String intentId =
                    session.path(
                            "id"
                    )
                            .asText();

            if (
                    hasText(
                            intentId
                    )
            ) {
                walletOrder.setPaymentExternalId(
                        intentId
                );
            }

            walletOrder.setPaymentProvider(
                    "STRIPE"
            );

            String intentCurrency =
                    session.path(
                            "currency"
                    )
                            .asText();

            if (
                    hasText(
                            intentCurrency
                    )
            ) {
                walletOrder.setPaymentCurrencyCode(
                        intentCurrency.toUpperCase(
                                Locale.ROOT
                        )
                );
            }

            if (
                    "payment_intent.succeeded".equals(
                            type
                    )
            ) {
                approveOrder(
                        walletOrder
                );

            } else if (
                    (
                            "payment_intent.canceled".equals(
                                    type
                            ) ||
                            "payment_intent.payment_failed".equals(
                                    type
                            )
                    ) &&
                    walletOrder.getPaymentStatus() !=
                            PaymentStatus.APPROVED
            ) {
                walletOrder.setPaymentStatus(
                        PaymentStatus.REJECTED
                );

                orderRepository.save(
                        walletOrder
                );
            }

            return;
        }

        if (
                !type.startsWith(
                        "checkout.session."
                )
        ) {
            return;
        }

        Long orderId =
                parseLong(
                        session.path(
                                "metadata"
                        )
                                .path(
                                        "order_id"
                                )
                                .asText()
                );

        Long metadataStoreId =
                parseLong(
                        session.path(
                                "metadata"
                        )
                                .path(
                                        "store_id"
                                )
                                .asText()
                );

        if (
                orderId == null ||
                metadataStoreId == null ||
                !storeId.equals(
                        metadataStoreId
                )
        ) {
            return;
        }

        Order order =
                orderRepository
                        .findById(
                                orderId
                        )
                        .orElse(
                                null
                        );

        if (
                order == null ||
                order.getStore() == null ||
                !storeId.equals(
                        order.getStore()
                                .getId()
                )
        ) {
            return;
        }

        validateSessionOwnership(
                order,
                session
        );

        String sessionId =
                session.path(
                        "id"
                )
                        .asText();

        if (
                hasText(
                        sessionId
                )
        ) {
            order.setPaymentExternalId(
                    sessionId
            );
        }

        order.setPaymentProvider(
                "STRIPE"
        );

        String currency =
                session.path(
                        "currency"
                )
                        .asText();

        if (
                hasText(
                        currency
                )
        ) {
            order.setPaymentCurrencyCode(
                    currency.toUpperCase(
                            Locale.ROOT
                    )
            );
        }

        String paymentStatus =
                session.path(
                        "payment_status"
                )
                        .asText();

        if (
                "checkout.session.completed".equals(
                        type
                ) ||
                "checkout.session.async_payment_succeeded".equals(
                        type
                )
        ) {
            if (
                    "paid".equalsIgnoreCase(
                            paymentStatus
                    ) ||
                    "no_payment_required".equalsIgnoreCase(
                            paymentStatus
                    )
            ) {
                approveOrder(
                        order
                );
            }

            return;
        }

        if (
                (
                        "checkout.session.async_payment_failed".equals(
                                type
                        ) ||
                        "checkout.session.expired".equals(
                                type
                        )
                ) &&
                order.getPaymentStatus()
                        != PaymentStatus.APPROVED
        ) {
            order.setPaymentStatus(
                    PaymentStatus.REJECTED
            );

            orderRepository.save(
                    order
            );
        }
    }

    // =========================
    // STRIPE HTTP
    // =========================

    private void validateRestrictedApiKey(
            String apiKey
    ) {

        get(
                "/checkout/sessions?limit=1",
                apiKey
        );
    }

    private JsonNode getCheckoutSession(
            Long storeId,
            String sessionId
    ) {

        return get(
                "/checkout/sessions/"
                        + sessionId,
                getRestrictedApiKey(
                        storeId
                )
        );
    }

    private JsonNode getPaymentIntent(
            Long storeId,
            String paymentIntentId
    ) {
        return get(
                "/payment_intents/"
                        + paymentIntentId,
                getRestrictedApiKey(
                        storeId
                )
        );
    }

    private JsonNode get(
            String path,
            String apiKey
    ) {

        HttpHeaders headers =
                authHeaders(
                        apiKey
                );

        try {
            ResponseEntity<JsonNode> response =
                    restTemplate.exchange(
                            API_BASE
                                    + path,
                            HttpMethod.GET,
                            new HttpEntity<>(
                                    headers
                            ),
                            JsonNode.class
                    );

            if (
                    response.getBody() ==
                    null
            ) {
                throw new IllegalStateException(
                        "A Stripe retornou uma resposta vazia."
                );
            }

            return response.getBody();

        } catch (
                HttpClientErrorException exception
        ) {
            throw stripeException(
                    exception
            );
        }
    }

    private JsonNode postForm(
            String path,
            MultiValueMap<String, String> form,
            String apiKey
    ) {

        HttpHeaders headers =
                authHeaders(
                        apiKey
                );

        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        try {
            ResponseEntity<JsonNode> response =
                    restTemplate.exchange(
                            API_BASE
                                    + path,
                            HttpMethod.POST,
                            new HttpEntity<>(
                                    form,
                                    headers
                            ),
                            JsonNode.class
                    );

            if (
                    response.getBody() ==
                    null
            ) {
                throw new IllegalStateException(
                        "A Stripe retornou uma resposta vazia."
                );
            }

            return response.getBody();

        } catch (
                HttpClientErrorException exception
        ) {
            throw stripeException(
                    exception
            );
        }
    }

    private HttpHeaders authHeaders(
            String apiKey
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                apiKey
        );

        headers.setAccept(
                java.util.List.of(
                        MediaType.APPLICATION_JSON
                )
        );

        return headers;
    }

    private IllegalStateException stripeException(
            HttpClientErrorException exception
    ) {

        String message =
                "Stripe recusou a operação.";

        try {
            JsonNode payload =
                    objectMapper.readTree(
                            exception
                                    .getResponseBodyAsString()
                    );

            String stripeMessage =
                    payload.path(
                            "error"
                    )
                            .path(
                                    "message"
                            )
                            .asText();

            if (
                    hasText(
                            stripeMessage
                    )
            ) {
                message =
                        stripeMessage;
            }

        } catch (Exception ignored) {
        }

        return new IllegalStateException(
                message,
                exception
        );
    }

    // =========================
    // CREDENCIAIS
    // =========================

    private StripePaymentConnection
    getConnectedConnection(
            Long storeId
    ) {

        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "Stripe não está configurada para esta loja."
                                )
                );
    }

    private String getRestrictedApiKey(
            Long storeId
    ) {

        String encrypted =
                getConnectedConnection(
                        storeId
                )
                        .getRestrictedApiKeyEncrypted();

        String value =
                encryptionService.decrypt(
                        encrypted
                );

        if (
                !hasText(
                        value
                )
        ) {
            throw new IllegalStateException(
                    "Chave Stripe não disponível."
            );
        }

        return value;
    }

    private String getWebhookSecret(
            Long storeId
    ) {

        String encrypted =
                getConnectedConnection(
                        storeId
                )
                        .getWebhookSecretEncrypted();

        String value =
                encryptionService.decrypt(
                        encrypted
                );

        if (
                !hasText(
                        value
                )
        ) {
            throw new IllegalStateException(
                    "Webhook Stripe não configurado."
            );
        }

        return value;
    }

    // =========================
    // PEDIDO
    // =========================

    private void validateOrderForStripe(
            Order order
    ) {

        if (
                order == null ||
                order.getStore() == null
        ) {
            throw new IllegalArgumentException(
                    "Pedido inválido."
            );
        }

        if (
                "BR".equalsIgnoreCase(
                        order.getStore()
                                .getCountryCode()
                )
        ) {
            throw new IllegalArgumentException(
                    "Esta loja usa Mercado Pago para pagamentos no Brasil."
            );
        }

        if (
                order.getPaymentMethod()
                        != PaymentMethod.CREDIT_CARD
        ) {
            throw new IllegalArgumentException(
                    "Este pedido não foi criado para pagamento online internacional."
            );
        }

        if (
                order.getTotal() == null ||
                order.getTotal()
                        .compareTo(
                                BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new IllegalArgumentException(
                    "Total do pedido inválido."
            );
        }

        if (
                !isReady(
                        order.getStore()
                                .getId()
                )
        ) {
            throw new IllegalStateException(
                    "A loja ainda não configurou o recebimento pela Stripe."
            );
        }
    }

    private void validateSessionOwnership(
            Order order,
            JsonNode session
    ) {

        String metadataOrderId =
                session.path(
                        "metadata"
                )
                        .path(
                                "order_id"
                        )
                        .asText();

        String metadataStoreId =
                session.path(
                        "metadata"
                )
                        .path(
                                "store_id"
                        )
                        .asText();

        if (
                !String.valueOf(
                        order.getId()
                )
                        .equals(
                                metadataOrderId
                        ) ||
                !String.valueOf(
                        order.getStore()
                                .getId()
                )
                        .equals(
                                metadataStoreId
                        )
        ) {
            throw new SecurityException(
                    "Sessão Stripe não pertence a este pedido."
            );
        }
    }

    private void approveOrder(
            Order order
    ) {

        boolean firstApproval =
                order.getPaymentStatus()
                        != PaymentStatus.APPROVED;

        order.setPaymentStatus(
                PaymentStatus.APPROVED
        );

        order.setStatus(
                OrderStatus.RECEIVED
        );

        order.setPaymentProvider(
                "STRIPE"
        );

        order.setPaymentPaidAt(
                order.getPaymentPaidAt() != null
                        ? order.getPaymentPaidAt()
                        : LocalDateTime.now()
        );

        order =
                orderRepository.save(
                        order
                );

        if (firstApproval) {
            couponService.registerUsageForOrder(
                    order
            );

            loyaltyService.registerForOrder(
                    order
            );
        }
    }

    // =========================
    // WEBHOOK SIGNATURE
    // =========================

    private boolean verifyWebhookSignature(
            String payload,
            String signatureHeader,
            String webhookSecret
    ) {

        if (
                !hasText(
                        payload
                ) ||
                !hasText(
                        signatureHeader
                ) ||
                !hasText(
                        webhookSecret
                )
        ) {
            return false;
        }

        Long timestamp =
                null;

        java.util.ArrayList<String> signatures =
                new java.util.ArrayList<>();

        for (
                String piece :
                signatureHeader.split(
                        ","
                )
        ) {
            String[] pair =
                    piece.trim()
                            .split(
                                    "=",
                                    2
                            );

            if (
                    pair.length != 2
            ) {
                continue;
            }

            if (
                    "t".equals(
                            pair[0]
                    )
            ) {
                timestamp =
                        parseLong(
                                pair[1]
                        );
            }

            if (
                    "v1".equals(
                            pair[0]
                    )
            ) {
                signatures.add(
                        pair[1]
                );
            }
        }

        if (
                timestamp == null ||
                signatures.isEmpty()
        ) {
            return false;
        }

        if (
                Math.abs(
                        Instant.now()
                                .getEpochSecond()
                                - timestamp
                ) >
                WEBHOOK_TOLERANCE_SECONDS
        ) {
            return false;
        }

        byte[] expected;

        try {
            Mac mac =
                    Mac.getInstance(
                            "HmacSHA256"
                    );

            mac.init(
                    new SecretKeySpec(
                            webhookSecret
                                    .getBytes(
                                            StandardCharsets.UTF_8
                                    ),
                            "HmacSHA256"
                    )
            );

            expected =
                    mac.doFinal(
                            (
                                    timestamp
                                            + "."
                                            + payload
                            )
                                    .getBytes(
                                            StandardCharsets.UTF_8
                                    )
                    );

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Não foi possível validar o webhook Stripe.",
                    exception
            );
        }

        for (
                String signature :
                signatures
        ) {
            byte[] actual =
                    decodeHex(
                            signature
                    );

            if (
                    actual != null &&
                    MessageDigest.isEqual(
                            expected,
                            actual
                    )
            ) {
                return true;
            }
        }

        return false;
    }

    // =========================
    // HELPERS
    // =========================

    private String normalizePublicApiUrl(
            String value
    ) {

        String normalized =
                value == null ||
                value.isBlank()
                        ? "https://pizzasystem-api.onrender.com"
                        : value.trim();

        while (
                normalized.endsWith(
                        "/"
                )
        ) {
            normalized =
                    normalized.substring(
                            0,
                            normalized.length() - 1
                    );
        }

        return normalized;
    }

    private String normalizeRestrictedApiKey(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Informe a Restricted API Key da Stripe."
            );
        }

        String normalized =
                value.trim();

        if (
                !normalized.startsWith(
                        "rk_live_"
                ) &&
                !normalized.startsWith(
                        "rk_test_"
                )
        ) {
            throw new IllegalArgumentException(
                    "Use uma Restricted API Key da Stripe (rk_live_... ou rk_test_...)."
            );
        }

        return normalized;
    }

    private String normalizePublishableKey(
            String value
    ) {
        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Informe a Publishable Key da Stripe."
            );
        }

        String normalized =
                value.trim();

        if (
                !normalized.startsWith(
                        "pk_live_"
                ) &&
                !normalized.startsWith(
                        "pk_test_"
                )
        ) {
            throw new IllegalArgumentException(
                    "Use uma Publishable Key da Stripe (pk_live_... ou pk_test_...)."
            );
        }

        return normalized;
    }

    private String normalizeWebhookSecret(
            String value
    ) {

        if (
                value == null ||
                value.isBlank() ||
                !value.trim()
                        .startsWith(
                                "whsec_"
                        )
        ) {
            throw new IllegalArgumentException(
                    "Informe o signing secret do webhook Stripe (whsec_...)."
            );
        }

        return value.trim();
    }

    private String normalizeCurrency(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Moeda da loja não configurada."
            );
        }

        String normalized =
                value.trim()
                        .toUpperCase(
                                Locale.ROOT
                        );

        if (
                !java.util.Set.of(
                        "USD",
                        "EUR",
                        "GBP",
                        "CAD",
                        "BRL"
                )
                        .contains(
                                normalized
                        )
        ) {
            throw new IllegalArgumentException(
                    "Moeda não suportada pela integração."
            );
        }

        return normalized;
    }

    private long toMinorUnits(
            BigDecimal amount,
            String currency
    ) {

        int fractionDigits =
                2;

        try {
            fractionDigits =
                    Math.max(
                            0,
                            Currency
                                    .getInstance(
                                            currency
                                    )
                                    .getDefaultFractionDigits()
                    );

        } catch (
                IllegalArgumentException ignored
        ) {
        }

        return amount
                .movePointRight(
                        fractionDigits
                )
                .setScale(
                        0,
                        RoundingMode.HALF_UP
                )
                .longValueExact();
    }

    private String normalizeReturnOrigin(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Origem do checkout não informada."
            );
        }

        URI uri;

        try {
            uri =
                    URI.create(
                            value.trim()
                    );

        } catch (
                IllegalArgumentException exception
        ) {
            throw new IllegalArgumentException(
                    "Origem do checkout inválida."
            );
        }

        String scheme =
                uri.getScheme();

        String host =
                uri.getHost();

        boolean local =
                "localhost".equalsIgnoreCase(
                        host
                ) ||
                "127.0.0.1".equals(
                        host
                );

        if (
                host == null ||
                (
                        !"https".equalsIgnoreCase(
                                scheme
                        ) &&
                        !(
                                local &&
                                "http".equalsIgnoreCase(
                                        scheme
                                )
                        )
                )
        ) {
            throw new IllegalArgumentException(
                    "Origem do checkout inválida."
            );
        }

        String port =
                uri.getPort() > 0
                        ? ":"
                        + uri.getPort()
                        : "";

        return scheme
                + "://"
                + host
                + port;
    }

    private Long parseLong(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            return null;
        }

        try {
            return Long.valueOf(
                    value
            );

        } catch (
                NumberFormatException exception
        ) {
            return null;
        }
    }

    private boolean hasText(
            String value
    ) {
        return value != null &&
                !value.isBlank();
    }

    private byte[] decodeHex(
            String value
    ) {

        if (
                value == null ||
                value.length() % 2 != 0
        ) {
            return null;
        }

        byte[] bytes =
                new byte[
                        value.length() / 2
                ];

        try {
            for (
                    int i = 0;
                    i < bytes.length;
                    i++
            ) {
                int index =
                        i * 2;

                bytes[i] =
                        (byte)
                                Integer.parseInt(
                                        value.substring(
                                                index,
                                                index + 2
                                        ),
                                        16
                                );
            }

            return bytes;

        } catch (
                NumberFormatException exception
        ) {
            return null;
        }
    }

    public record StripeCheckoutSession(
            String id,
            String url,
            String status,
            String paymentStatus
    ) {
    }

    public record StripeWalletIntent(
            String id,
            String clientSecret,
            String status
    ) {
    }
}
