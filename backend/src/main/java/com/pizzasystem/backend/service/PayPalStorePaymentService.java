package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.PayPalPaymentConnection;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.PayPalPaymentConnectionRepository;

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

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.time.LocalDateTime;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PayPalStorePaymentService {

    private static final String LIVE_API =
            "https://api-m.paypal.com";

    private static final String SANDBOX_API =
            "https://api-m.sandbox.paypal.com";

    private final PayPalPaymentConnectionRepository connectionRepository;
    private final OrderRepository orderRepository;
    private final CredentialEncryptionService encryptionService;
    private final CouponService couponService;
    private final LoyaltyService loyaltyService;
    private final PayPalPartnerService payPalPartnerService;

    @Value("${PAYPAL_PLATFORM_ENABLED:false}")
    private boolean payPalEnabled;

    private final RestTemplate restTemplate =
            new RestTemplate();

    private final ObjectMapper objectMapper =
            new ObjectMapper();

    public PayPalStorePaymentService(
            PayPalPaymentConnectionRepository connectionRepository,
            OrderRepository orderRepository,
            CredentialEncryptionService encryptionService,
            CouponService couponService,
            LoyaltyService loyaltyService,
            PayPalPartnerService payPalPartnerService
    ) {
        this.connectionRepository = connectionRepository;
        this.orderRepository = orderRepository;
        this.encryptionService = encryptionService;
        this.couponService = couponService;
        this.loyaltyService = loyaltyService;
        this.payPalPartnerService = payPalPartnerService;
    }

    @Transactional
    public Map<String, Object> getConnectionStatus(
            Store store
    ) {
        PayPalPaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElse(
                                null
                        );

        if (
                connection != null &&
                connection.isConnected() &&
                hasText(
                        connection.getPartnerMerchantId()
                )
        ) {
            payPalPartnerService
                    .refreshMerchantStatus(
                            connection
                    );
        }

        boolean partnerConnected =
                connection != null &&
                connection.isConnected() &&
                hasText(
                        connection.getPartnerMerchantId()
                );

        boolean legacyConnected =
                connection != null &&
                connection.isConnected() &&
                hasText(
                        connection.getClientId()
                ) &&
                hasText(
                        connection.getClientSecretEncrypted()
                );

        boolean connected =
                payPalEnabled &&
                (
                        partnerConnected ||
                        legacyConnected
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put("connected", connected);
        response.put("provider", "PAYPAL");
        response.put("countryCode", store.getCountryCode());
        response.put("currencyCode", store.getCurrencyCode());

        response.put(
                "recommended",
                !"BR".equalsIgnoreCase(
                        store.getCountryCode()
                )
        );

        response.put(
                "automaticConnection",
                partnerConnected
        );

        response.put(
                "connectionMode",
                partnerConnected
                        ? "PARTNER"
                        : (
                                legacyConnected
                                        ? "LEGACY"
                                        : "NONE"
                        )
        );

        response.put(
                "merchantId",
                partnerConnected
                        ? connection.getPartnerMerchantId()
                        : null
        );

        response.put(
                "paymentsReceivable",
                partnerConnected
                        ? connection.isPaymentsReceivable()
                        : legacyConnected
        );

        response.put(
                "primaryEmailConfirmed",
                partnerConnected
                        ? connection.isPrimaryEmailConfirmed()
                        : legacyConnected
        );

        response.put(
                "permissionsGranted",
                partnerConnected
                        ? connection.isPermissionsGranted()
                        : legacyConnected
        );

        response.put(
                "accountStatus",
                partnerConnected
                        ? connection.getAccountStatus()
                        : null
        );

        response.put(
                "clientIdLast4",
                legacyConnected
                        ? connection.getClientIdLast4()
                        : null
        );

        response.put(
                "connectedAt",
                connection != null
                        ? connection.getConnectedAt()
                        : null
        );

        response.put(
                "sandbox",
                partnerConnected
                        ? payPalPartnerService.isSandbox()
                        : connection != null &&
                        connection.isSandbox()
        );

        return response;
    }

    @Transactional
    public Map<String, Object> connect(
            Store store,
            String clientId,
            String clientSecret,
            boolean sandbox
    ) {
        if (!payPalEnabled) {
            throw new IllegalStateException(
                    "PayPal ainda não está disponível."
            );
        }

        String normalizedClientId =
                requireText(
                        clientId,
                        "Informe o Client ID do PayPal."
                );

        String normalizedSecret =
                requireText(
                        clientSecret,
                        "Informe o Client Secret do PayPal."
                );

        getAccessToken(
                normalizedClientId,
                normalizedSecret,
                sandbox
        );

        PayPalPaymentConnection connection =
                connectionRepository
                        .findByStoreId(store.getId())
                        .orElseGet(
                                PayPalPaymentConnection::new
                        );

        connection.setStore(store);
        connection.setClientId(normalizedClientId);
        connection.setClientSecretEncrypted(
                encryptionService.encrypt(normalizedSecret)
        );
        connection.setClientIdLast4(
                normalizedClientId.length() <= 4
                        ? normalizedClientId
                        : normalizedClientId.substring(
                                normalizedClientId.length() - 4
                        )
        );
        connection.setSandbox(sandbox);
        connection.setConnected(true);
        connection.setConnectedAt(LocalDateTime.now());
        connection.setDisconnectedAt(null);

        connectionRepository.save(connection);

        return getConnectionStatus(store);
    }

    @Transactional
    public void disconnect(
            Store store
    ) {
        PayPalPaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElse(
                                null
                        );

        if (
                connection == null
        ) {
            return;
        }

        if (
                hasText(
                        connection.getPartnerMerchantId()
                )
        ) {
            payPalPartnerService
                    .disconnect(
                            store
                    );

            return;
        }

        connection.setClientId("");
        connection.setClientSecretEncrypted(null);
        connection.setClientIdLast4(null);
        connection.setConnected(false);
        connection.setDisconnectedAt(LocalDateTime.now());

        connectionRepository.save(connection);
    }

    @Transactional(readOnly = true)
    public boolean isReady(
            Long storeId
    ) {
        if (!payPalEnabled) {
            return false;
        }

        PayPalPaymentConnection connection =
                connectionRepository
                        .findByStoreIdAndConnectedTrue(
                                storeId
                        )
                        .orElse(
                                null
                        );

        if (
                connection == null
        ) {
            return false;
        }

        if (
                hasText(
                        connection.getPartnerMerchantId()
                )
        ) {
            return payPalPartnerService
                    .isConfigured()
                    &&
                    connection.isPermissionsGranted()
                    &&
                    connection.isPaymentsReceivable()
                    &&
                    connection.isPrimaryEmailConfirmed();
        }

        return hasText(
                connection.getClientId()
        )
                &&
                hasText(
                        connection.getClientSecretEncrypted()
                );
    }

    @Transactional
    public PayPalCheckoutOrder createCheckoutOrder(
            Order order,
            String publicAccessToken,
            String returnOrigin
    ) {
        validateOrderForPayPal(order);

        if (
                order.getPaymentStatus() ==
                        PaymentStatus.APPROVED
        ) {
            throw new IllegalStateException(
                    "Este pedido já foi pago."
            );
        }

        PayPalPaymentConnection connection =
                getConnectedConnection(
                        order.getStore().getId()
                );

        PayPalRequestContext requestContext =
                getRequestContext(
                        connection
                );

        String accessToken =
                requestContext.accessToken();

        String origin =
                normalizeReturnOrigin(returnOrigin);

        String publicToken =
                URLEncoder.encode(
                        publicAccessToken,
                        StandardCharsets.UTF_8
                );

        String slug =
                URLEncoder.encode(
                        order.getStore().getSlug(),
                        StandardCharsets.UTF_8
                );

        String returnUrl =
                origin
                        + "/pagamento/sucesso/"
                        + order.getId()
                        + "?access="
                        + publicToken
                        + "&store="
                        + slug
                        + "&paypal=success";

        String cancelUrl =
                origin
                        + "/pagamento/paypal/"
                        + order.getId()
                        + "?token="
                        + publicToken
                        + "&store="
                        + slug
                        + "&cancelled=1";

        String currency =
                normalizeCurrency(
                        hasText(order.getPaymentCurrencyCode())
                                ? order.getPaymentCurrencyCode()
                                : order.getStore().getCurrencyCode()
                );

        Map<String, Object> amount =
                Map.of(
                        "currency_code", currency,
                        "value",
                        order.getTotal()
                                .setScale(
                                        2,
                                        java.math.RoundingMode.HALF_UP
                                )
                                .toPlainString()
                );

        Map<String, Object> purchaseUnit =
                new HashMap<>();

        purchaseUnit.put(
                "reference_id",
                String.valueOf(order.getId())
        );
        purchaseUnit.put(
                "custom_id",
                String.valueOf(order.getId())
        );
        purchaseUnit.put(
                "description",
                order.getStore().getName()
                        + " - Order #"
                        + order.getId()
        );
        purchaseUnit.put("amount", amount);

        if (
                hasText(
                        requestContext.partnerMerchantId()
                )
        ) {
            purchaseUnit.put(
                    "payee",
                    Map.of(
                            "merchant_id",
                            requestContext.partnerMerchantId()
                    )
            );
        }

        Map<String, Object> applicationContext =
                new HashMap<>();

        applicationContext.put(
                "brand_name",
                order.getStore().getName()
        );
        applicationContext.put(
                "return_url",
                returnUrl
        );
        applicationContext.put(
                "cancel_url",
                cancelUrl
        );
        applicationContext.put(
                "user_action",
                "PAY_NOW"
        );
        applicationContext.put(
                "shipping_preference",
                "NO_SHIPPING"
        );

        Map<String, Object> payload =
                new HashMap<>();

        payload.put("intent", "CAPTURE");
        payload.put(
                "purchase_units",
                List.of(purchaseUnit)
        );
        payload.put(
                "application_context",
                applicationContext
        );

        HttpHeaders headers =
                bearerHeaders(accessToken);

        if (
                hasText(
                        requestContext.partnerMerchantId()
                )
        ) {
            payPalPartnerService
                    .applyMerchantHeaders(
                            headers,
                            requestContext.partnerMerchantId()
                    );
        }

        headers.set(
                "PayPal-Request-Id",
                "pizzasystem-order-"
                        + order.getId()
                        + "-create"
        );

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        JsonNode response =
                exchangeJson(
                        apiBase(requestContext.sandbox())
                                + "/v2/checkout/orders",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                payload,
                                headers
                        )
                );

        String payPalOrderId =
                response.path("id").asText();

        String status =
                response.path("status").asText();

        String approvalUrl =
                findLink(response, "approve");

        if (!hasText(approvalUrl)) {
            approvalUrl =
                    findLink(
                            response,
                            "payer-action"
                    );
        }

        if (
                !hasText(payPalOrderId) ||
                !hasText(approvalUrl)
        ) {
            throw new IllegalStateException(
                    "O PayPal não retornou uma ordem de pagamento válida."
            );
        }

        order.setPaymentExternalId(payPalOrderId);
        order.setPaymentProvider("PAYPAL");
        order.setPaymentCurrencyCode(currency);

        orderRepository.save(order);

        return new PayPalCheckoutOrder(
                payPalOrderId,
                approvalUrl,
                status
        );
    }

    @Transactional
    public Order captureCheckoutOrder(
            Order order,
            String payPalOrderId
    ) {
        validateOrderForPayPal(order);

        if (
                order.getPaymentStatus() ==
                        PaymentStatus.APPROVED
        ) {
            return order;
        }

        if (
                !hasText(payPalOrderId) ||
                !payPalOrderId.equals(
                        order.getPaymentExternalId()
                )
        ) {
            throw new SecurityException(
                    "Ordem PayPal não pertence a este pedido."
            );
        }

        PayPalPaymentConnection connection =
                getConnectedConnection(
                        order.getStore().getId()
                );

        PayPalRequestContext requestContext =
                getRequestContext(
                        connection
                );

        String accessToken =
                requestContext.accessToken();

        HttpHeaders headers =
                bearerHeaders(accessToken);

        if (
                hasText(
                        requestContext.partnerMerchantId()
                )
        ) {
            payPalPartnerService
                    .applyMerchantHeaders(
                            headers,
                            requestContext.partnerMerchantId()
                    );
        }

        headers.set(
                "PayPal-Request-Id",
                "pizzasystem-order-"
                        + order.getId()
                        + "-capture"
        );

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        JsonNode response =
                exchangeJson(
                        apiBase(requestContext.sandbox())
                                + "/v2/checkout/orders/"
                                + payPalOrderId
                                + "/capture",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                Map.of(),
                                headers
                        )
                );

        String status =
                response.path("status").asText();

        String customId =
                response.path("purchase_units")
                        .path(0)
                        .path("custom_id")
                        .asText();

        if (
                hasText(customId) &&
                !String.valueOf(order.getId())
                        .equals(customId)
        ) {
            throw new SecurityException(
                    "Ordem PayPal não pertence a este pedido."
            );
        }

        if (
                "COMPLETED".equalsIgnoreCase(status)
        ) {
            approveOrder(order);

        } else {
            throw new IllegalStateException(
                    "O pagamento PayPal ainda não foi concluído."
            );
        }

        return order;
    }

    private void validateOrderForPayPal(
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
                        order.getStore().getCountryCode()
                )
        ) {
            throw new IllegalArgumentException(
                    "Este fluxo PayPal está disponível para lojas internacionais."
            );
        }

        if (
                order.getPaymentMethod() !=
                        PaymentMethod.PAYPAL
        ) {
            throw new IllegalArgumentException(
                    "Este pedido não foi criado para pagamento via PayPal."
            );
        }

        if (
                order.getTotal() == null ||
                order.getTotal()
                        .compareTo(
                                java.math.BigDecimal.ZERO
                        ) <= 0
        ) {
            throw new IllegalArgumentException(
                    "Total do pedido inválido."
            );
        }

        if (
                !isReady(
                        order.getStore().getId()
                )
        ) {
            throw new IllegalStateException(
                    "A loja ainda não configurou o PayPal."
            );
        }
    }

    private void approveOrder(
            Order order
    ) {
        boolean firstApproval =
                order.getPaymentStatus() !=
                        PaymentStatus.APPROVED;

        order.setPaymentStatus(
                PaymentStatus.APPROVED
        );
        order.setStatus(
                OrderStatus.RECEIVED
        );
        order.setPaymentProvider(
                "PAYPAL"
        );
        order.setPaymentPaidAt(
                order.getPaymentPaidAt() != null
                        ? order.getPaymentPaidAt()
                        : LocalDateTime.now()
        );

        order = orderRepository.save(order);

        if (firstApproval) {
            couponService.registerUsageForOrder(order);
            loyaltyService.registerForOrder(order);
        }
    }

    private PayPalRequestContext getRequestContext(
            PayPalPaymentConnection connection
    ) {

        if (
                hasText(
                        connection.getPartnerMerchantId()
                )
        ) {
            return new PayPalRequestContext(
                    payPalPartnerService
                            .getPlatformAccessToken(),
                    payPalPartnerService
                            .isSandbox(),
                    connection.getPartnerMerchantId()
            );
        }

        String secret =
                encryptionService.decrypt(
                        connection.getClientSecretEncrypted()
                );

        return new PayPalRequestContext(
                getAccessToken(
                        connection.getClientId(),
                        secret,
                        connection.isSandbox()
                ),
                connection.isSandbox(),
                null
        );
    }

    private String getAccessToken(
            String clientId,
            String clientSecret,
            boolean sandbox
    ) {
        HttpHeaders headers =
                new HttpHeaders();

        headers.setBasicAuth(
                clientId,
                clientSecret,
                StandardCharsets.UTF_8
        );
        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );
        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
        );

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "grant_type",
                "client_credentials"
        );

        JsonNode response =
                exchangeJson(
                        apiBase(sandbox)
                                + "/v1/oauth2/token",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                form,
                                headers
                        )
                );

        String accessToken =
                response.path("access_token")
                        .asText();

        if (!hasText(accessToken)) {
            throw new IllegalStateException(
                    "O PayPal não aceitou as credenciais informadas."
            );
        }

        return accessToken;
    }

    private JsonNode exchangeJson(
            String url,
            HttpMethod method,
            HttpEntity<?> entity
    ) {
        try {
            ResponseEntity<JsonNode> response =
                    restTemplate.exchange(
                            url,
                            method,
                            entity,
                            JsonNode.class
                    );

            if (response.getBody() == null) {
                throw new IllegalStateException(
                        "O PayPal retornou uma resposta vazia."
                );
            }

            return response.getBody();

        } catch (
                HttpClientErrorException exception
        ) {
            throw payPalException(exception);
        }
    }

    private IllegalStateException payPalException(
            HttpClientErrorException exception
    ) {
        String message =
                "PayPal recusou a operação.";

        try {
            JsonNode payload =
                    objectMapper.readTree(
                            exception.getResponseBodyAsString()
                    );

            String details =
                    payload.path("details")
                            .path(0)
                            .path("description")
                            .asText();

            String errorDescription =
                    payload.path("error_description")
                            .asText();

            if (hasText(details)) {
                message = details;
            } else if (
                    hasText(errorDescription)
            ) {
                message = errorDescription;
            }

        } catch (Exception ignored) {
        }

        return new IllegalStateException(
                message,
                exception
        );
    }

    private HttpHeaders bearerHeaders(
            String accessToken
    ) {
        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(accessToken);
        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
        );

        return headers;
    }

    private PayPalPaymentConnection
    getConnectedConnection(
            Long storeId
    ) {
        return connectionRepository
                .findByStoreIdAndConnectedTrue(storeId)
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "PayPal não está configurado para esta loja."
                                )
                );
    }

    private String findLink(
            JsonNode response,
            String rel
    ) {
        for (
                JsonNode link :
                response.path("links")
        ) {
            if (
                    rel.equalsIgnoreCase(
                            link.path("rel").asText()
                    )
            ) {
                return link.path("href").asText();
            }
        }

        return null;
    }

    private String apiBase(
            boolean sandbox
    ) {
        return sandbox
                ? SANDBOX_API
                : LIVE_API;
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
                        "AUD",
                        "BRL"
                )
                        .contains(normalized)
        ) {
            throw new IllegalArgumentException(
                    "Moeda não suportada pela integração."
            );
        }

        return normalized;
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
            uri = URI.create(value.trim());

        } catch (
                IllegalArgumentException exception
        ) {
            throw new IllegalArgumentException(
                    "Origem do checkout inválida."
            );
        }

        String scheme = uri.getScheme();
        String host = uri.getHost();

        boolean local =
                "localhost".equalsIgnoreCase(host) ||
                "127.0.0.1".equals(host);

        if (
                host == null ||
                (
                        !"https".equalsIgnoreCase(scheme) &&
                        !(local && "http".equalsIgnoreCase(scheme))
                )
        ) {
            throw new IllegalArgumentException(
                    "Origem do checkout inválida."
            );
        }

        String port =
                uri.getPort() > 0
                        ? ":" + uri.getPort()
                        : "";

        return scheme
                + "://"
                + host
                + port;
    }

    private String requireText(
            String value,
            String message
    ) {
        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    message
            );
        }

        return value.trim();
    }

    private boolean hasText(
            String value
    ) {
        return value != null &&
                !value.isBlank();
    }

    private record PayPalRequestContext(
            String accessToken,
            boolean sandbox,
            String partnerMerchantId
    ) {
    }

    public record PayPalCheckoutOrder(
            String id,
            String url,
            String status
    ) {
    }
}
