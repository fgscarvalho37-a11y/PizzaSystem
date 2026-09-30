package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.pizzasystem.backend.entity.PayPalPartnerOnboardingState;
import com.pizzasystem.backend.entity.PayPalPaymentConnection;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.PayPalPartnerOnboardingStateRepository;
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

import java.nio.charset.StandardCharsets;

import java.security.SecureRandom;

import java.time.LocalDateTime;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PayPalPartnerService {

    private static final String LIVE_API =
            "https://api-m.paypal.com";

    private static final String SANDBOX_API =
            "https://api-m.sandbox.paypal.com";

    private static final int STATE_EXPIRATION_MINUTES =
            15;

    private final PayPalPaymentConnectionRepository
            connectionRepository;

    private final PayPalPartnerOnboardingStateRepository
            onboardingStateRepository;

    private final CurrentStoreService
            currentStoreService;

    private final RestTemplate
            restTemplate =
            new RestTemplate();

    private final ObjectMapper
            objectMapper =
            new ObjectMapper();

    private final SecureRandom
            secureRandom =
            new SecureRandom();

    @Value("${PAYPAL_PLATFORM_CLIENT_ID:}")
    private String platformClientId;

    @Value("${PAYPAL_PLATFORM_CLIENT_SECRET:}")
    private String platformClientSecret;

    @Value("${PAYPAL_PARTNER_MERCHANT_ID:}")
    private String partnerMerchantId;

    @Value("${PAYPAL_PARTNER_ATTRIBUTION_ID:}")
    private String partnerAttributionId;

    @Value("${PAYPAL_PLATFORM_SANDBOX:true}")
    private boolean sandbox;

    @Value(
            "${PAYPAL_ONBOARDING_RETURN_URL:https://pizzasystem-api.onrender.com/api/admin/paypal-payment/onboarding/return}"
    )
    private String returnUrl;

    public PayPalPartnerService(
            PayPalPaymentConnectionRepository connectionRepository,
            PayPalPartnerOnboardingStateRepository onboardingStateRepository,
            CurrentStoreService currentStoreService
    ) {
        this.connectionRepository =
                connectionRepository;

        this.onboardingStateRepository =
                onboardingStateRepository;

        this.currentStoreService =
                currentStoreService;
    }

    @Transactional
    public String createOnboardingUrl() {

        validateConfiguration();

        Store store =
                currentStoreService
                        .getCurrentStore();

        invalidatePreviousStates(
                store
        );

        String trackingId =
                generateRandomValue(
                        32
                );

        PayPalPartnerOnboardingState state =
                new PayPalPartnerOnboardingState();

        state.setStore(
                store
        );

        state.setTrackingId(
                trackingId
        );

        state.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(
                                STATE_EXPIRATION_MINUTES
                        )
        );

        onboardingStateRepository.save(
                state
        );

        String accessToken =
                getPlatformAccessToken();

        Map<String, Object> thirdPartyDetails =
                Map.of(
                        "features",
                        List.of(
                                "PAYMENT",
                                "REFUND"
                        )
                );

        Map<String, Object> restIntegration =
                new HashMap<>();

        restIntegration.put(
                "integration_method",
                "PAYPAL"
        );

        restIntegration.put(
                "integration_type",
                "THIRD_PARTY"
        );

        restIntegration.put(
                "third_party_details",
                thirdPartyDetails
        );

        Map<String, Object> apiIntegrationPreference =
                Map.of(
                        "rest_api_integration",
                        restIntegration
                );

        Map<String, Object> operation =
                Map.of(
                        "operation",
                        "API_INTEGRATION",
                        "api_integration_preference",
                        apiIntegrationPreference
                );

        Map<String, Object> partnerConfig =
                new HashMap<>();

        partnerConfig.put(
                "return_url",
                returnUrl
        );

        partnerConfig.put(
                "return_url_description",
                "Return to PizzaSystem"
        );

        Map<String, Object> payload =
                new HashMap<>();

        payload.put(
                "tracking_id",
                trackingId
        );

        payload.put(
                "operations",
                List.of(
                        operation
                )
        );

        payload.put(
                "products",
                List.of(
                        "EXPRESS_CHECKOUT"
                )
        );

        payload.put(
                "partner_config_override",
                partnerConfig
        );

        payload.put(
                "legal_consents",
                List.of(
                        Map.of(
                                "type",
                                "SHARE_DATA_CONSENT",
                                "granted",
                                true
                        )
                )
        );

        HttpHeaders headers =
                platformHeaders(
                        accessToken
                );

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        JsonNode response =
                exchangeJson(
                        apiBase()
                                + "/v2/customer/partner-referrals",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                payload,
                                headers
                        )
                );

        String actionUrl =
                findLink(
                        response,
                        "action_url"
                );

        if (
                !hasText(
                        actionUrl
                )
        ) {
            throw new IllegalStateException(
                    "O PayPal não retornou a página de conexão da conta."
            );
        }

        return actionUrl;
    }

    @Transactional
    public Store completeOnboarding(
            String trackingId,
            String merchantIdInPayPal,
            boolean permissionsGranted,
            boolean consentGranted,
            boolean emailConfirmed,
            String accountStatus
    ) {

        validateConfiguration();

        if (
                !hasText(
                        trackingId
                )
        ) {
            throw new IllegalArgumentException(
                    "Identificador do onboarding PayPal não informado."
            );
        }

        PayPalPartnerOnboardingState state =
                onboardingStateRepository
                        .findByTrackingIdAndUsedFalse(
                                trackingId.trim()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Onboarding PayPal inválido ou já utilizado."
                                        )
                        );

        if (
                !state.isValid()
        ) {
            state.markAsUsed();

            onboardingStateRepository.save(
                    state
            );

            throw new IllegalArgumentException(
                    "Onboarding PayPal expirado."
            );
        }

        state.markAsUsed();

        onboardingStateRepository.save(
                state
        );

        if (
                !permissionsGranted ||
                !consentGranted ||
                !hasText(
                        merchantIdInPayPal
                )
        ) {
            throw new IllegalStateException(
                    "A conta PayPal não concedeu as permissões necessárias."
            );
        }

        String sellerMerchantId =
                merchantIdInPayPal.trim();

        MerchantStatus status =
                fetchMerchantStatus(
                        sellerMerchantId,
                        emailConfirmed
                );

        Store store =
                state.getStore();

        PayPalPaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElseGet(
                                PayPalPaymentConnection::new
                        );

        connection.setStore(
                store
        );

        connection.setPartnerMerchantId(
                sellerMerchantId
        );

        connection.setPartnerTrackingId(
                trackingId.trim()
        );

        connection.setAccountStatus(
                hasText(
                        accountStatus
                )
                        ? accountStatus.trim()
                        : null
        );

        connection.setPermissionsGranted(
                true
        );

        connection.setPaymentsReceivable(
                status.paymentsReceivable()
        );

        connection.setPrimaryEmailConfirmed(
                status.primaryEmailConfirmed()
        );

        connection.setClientId(
                ""
        );

        connection.setClientSecretEncrypted(
                null
        );

        connection.setClientIdLast4(
                null
        );

        connection.setSandbox(
                sandbox
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

        return store;
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

        connection.setPartnerMerchantId(
                null
        );

        connection.setPartnerTrackingId(
                null
        );

        connection.setAccountStatus(
                null
        );

        connection.setPermissionsGranted(
                false
        );

        connection.setPaymentsReceivable(
                false
        );

        connection.setPrimaryEmailConfirmed(
                false
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

    @Transactional
    public void refreshMerchantStatus(
            PayPalPaymentConnection connection
    ) {

        if (
                connection == null ||
                !connection.isConnected() ||
                !hasText(
                        connection.getPartnerMerchantId()
                ) ||
                !isConfigured()
        ) {
            return;
        }

        try {
            MerchantStatus status =
                    fetchMerchantStatus(
                            connection.getPartnerMerchantId(),
                            connection.isPrimaryEmailConfirmed()
                    );

            connection.setPaymentsReceivable(
                    status.paymentsReceivable()
            );

            connection.setPrimaryEmailConfirmed(
                    status.primaryEmailConfirmed()
            );

            connectionRepository.save(
                    connection
            );

        } catch (RuntimeException ignored) {
            // Mantém o último status conhecido se a consulta externa falhar.
        }
    }

    public String getPlatformAccessToken() {

        validateConfiguration();

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBasicAuth(
                platformClientId.trim(),
                platformClientSecret.trim(),
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
                        apiBase()
                                + "/v1/oauth2/token",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                form,
                                headers
                        )
                );

        String accessToken =
                response.path(
                        "access_token"
                )
                        .asText();

        if (
                !hasText(
                        accessToken
                )
        ) {
            throw new IllegalStateException(
                    "O PayPal não retornou o token da plataforma."
            );
        }

        return accessToken;
    }

    public void applyMerchantHeaders(
            HttpHeaders headers,
            String sellerMerchantId
    ) {

        if (
                headers == null
        ) {
            throw new IllegalArgumentException(
                    "Headers PayPal não informados."
            );
        }

        headers.set(
                "PayPal-Auth-Assertion",
                buildAuthAssertion(
                        sellerMerchantId
                )
        );

        if (
                hasText(
                        partnerAttributionId
                )
        ) {
            headers.set(
                    "PayPal-Partner-Attribution-Id",
                    partnerAttributionId.trim()
            );
        }
    }

    public boolean isConfigured() {
        return hasText(
                platformClientId
        )
                &&
                hasText(
                        platformClientSecret
                )
                &&
                hasText(
                        partnerMerchantId
                )
                &&
                hasText(
                        returnUrl
                );
    }

    public boolean isSandbox() {
        return sandbox;
    }

    public String apiBase() {
        return sandbox
                ? SANDBOX_API
                : LIVE_API;
    }

    private MerchantStatus fetchMerchantStatus(
            String sellerMerchantId,
            boolean callbackEmailConfirmed
    ) {

        String accessToken =
                getPlatformAccessToken();

        HttpHeaders headers =
                platformHeaders(
                        accessToken
                );

        applyMerchantHeaders(
                headers,
                sellerMerchantId
        );

        String url =
                apiBase()
                        + "/v1/customer/partners/"
                        + partnerMerchantId.trim()
                        + "/merchant-integrations/"
                        + sellerMerchantId;

        JsonNode response =
                exchangeJson(
                        url,
                        HttpMethod.GET,
                        new HttpEntity<>(
                                headers
                        )
                );

        boolean paymentsReceivable =
                response.path(
                        "payments_receivable"
                )
                        .asBoolean(
                                false
                        );

        boolean primaryEmailConfirmed =
                response.path(
                        "primary_email_confirmed"
                )
                        .asBoolean(
                                callbackEmailConfirmed
                        );

        return new MerchantStatus(
                paymentsReceivable,
                primaryEmailConfirmed
        );
    }

    private HttpHeaders platformHeaders(
            String accessToken
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                accessToken
        );

        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
        );

        if (
                hasText(
                        partnerAttributionId
                )
        ) {
            headers.set(
                    "PayPal-Partner-Attribution-Id",
                    partnerAttributionId.trim()
            );
        }

        return headers;
    }

    private String buildAuthAssertion(
            String sellerMerchantId
    ) {

        if (
                !hasText(
                        sellerMerchantId
                )
        ) {
            throw new IllegalArgumentException(
                    "Merchant ID PayPal não informado."
            );
        }

        try {
            String headerJson =
                    objectMapper
                            .writeValueAsString(
                                    Map.of(
                                            "alg",
                                            "none"
                                    )
                            );

            String payloadJson =
                    objectMapper
                            .writeValueAsString(
                                    Map.of(
                                            "iss",
                                            platformClientId.trim(),
                                            "payer_id",
                                            sellerMerchantId.trim()
                                    )
                            );

            String encodedHeader =
                    Base64
                            .getUrlEncoder()
                            .withoutPadding()
                            .encodeToString(
                                    headerJson.getBytes(
                                            StandardCharsets.UTF_8
                                    )
                            );

            String encodedPayload =
                    Base64
                            .getUrlEncoder()
                            .withoutPadding()
                            .encodeToString(
                                    payloadJson.getBytes(
                                            StandardCharsets.UTF_8
                                    )
                            );

            return encodedHeader
                    + "."
                    + encodedPayload
                    + ".";

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Não foi possível gerar a autorização PayPal da loja.",
                    exception
            );
        }
    }

    private void invalidatePreviousStates(
            Store store
    ) {

        List<PayPalPartnerOnboardingState> states =
                onboardingStateRepository
                        .findAllByStoreAndUsedFalse(
                                store
                        );

        for (
                PayPalPartnerOnboardingState state :
                states
        ) {
            state.markAsUsed();
        }

        if (
                !states.isEmpty()
        ) {
            onboardingStateRepository
                    .saveAll(
                            states
                    );
        }
    }

    private String findLink(
            JsonNode response,
            String rel
    ) {

        for (
                JsonNode link :
                response.path(
                        "links"
                )
        ) {
            if (
                    rel.equalsIgnoreCase(
                            link.path(
                                    "rel"
                            )
                                    .asText()
                    )
            ) {
                return link.path(
                        "href"
                )
                        .asText();
            }
        }

        return null;
    }

    private String generateRandomValue(
            int bytesCount
    ) {

        byte[] bytes =
                new byte[
                        bytesCount
                ];

        secureRandom.nextBytes(
                bytes
        );

        return Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        bytes
                );
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

            if (
                    response.getBody() ==
                    null
            ) {
                throw new IllegalStateException(
                        "O PayPal retornou uma resposta vazia."
                );
            }

            return response.getBody();

        } catch (
                HttpClientErrorException exception
        ) {
            throw payPalException(
                    exception
            );
        }
    }

    private IllegalStateException payPalException(
            HttpClientErrorException exception
    ) {

        String message =
                "PayPal recusou a operação da plataforma.";

        try {
            JsonNode payload =
                    objectMapper.readTree(
                            exception
                                    .getResponseBodyAsString()
                    );

            String details =
                    payload.path(
                            "details"
                    )
                            .path(
                                    0
                            )
                            .path(
                                    "description"
                            )
                            .asText();

            String errorDescription =
                    payload.path(
                            "error_description"
                    )
                            .asText();

            String apiMessage =
                    payload.path(
                            "message"
                    )
                            .asText();

            if (
                    hasText(
                            details
                    )
            ) {
                message =
                        details;

            } else if (
                    hasText(
                            errorDescription
                    )
            ) {
                message =
                        errorDescription;

            } else if (
                    hasText(
                            apiMessage
                    )
            ) {
                message =
                        apiMessage;
            }

        } catch (Exception ignored) {
        }

        return new IllegalStateException(
                message,
                exception
        );
    }

    private void validateConfiguration() {

        if (
                !hasText(
                        platformClientId
                )
        ) {
            throw new IllegalStateException(
                    "PAYPAL_PLATFORM_CLIENT_ID não configurado."
            );
        }

        if (
                !hasText(
                        platformClientSecret
                )
        ) {
            throw new IllegalStateException(
                    "PAYPAL_PLATFORM_CLIENT_SECRET não configurado."
            );
        }

        if (
                !hasText(
                        partnerMerchantId
                )
        ) {
            throw new IllegalStateException(
                    "PAYPAL_PARTNER_MERCHANT_ID não configurado."
            );
        }

        if (
                !hasText(
                        returnUrl
                )
        ) {
            throw new IllegalStateException(
                    "PAYPAL_ONBOARDING_RETURN_URL não configurada."
            );
        }
    }

    private boolean hasText(
            String value
    ) {
        return value != null
                && !value.isBlank();
    }

    private record MerchantStatus(
            boolean paymentsReceivable,
            boolean primaryEmailConfirmed
    ) {
    }
}
