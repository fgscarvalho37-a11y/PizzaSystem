package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.entity.StripeConnectOAuthState;
import com.pizzasystem.backend.entity.StripePaymentConnection;

import com.pizzasystem.backend.repository.StripeConnectOAuthStateRepository;
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
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

import java.security.SecureRandom;

import java.time.LocalDateTime;

import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
public class StripeConnectService {

    private static final String AUTHORIZATION_URL =
            "https://connect.stripe.com/oauth/authorize";

    private static final String TOKEN_URL =
            "https://connect.stripe.com/oauth/token";

    private static final String DEAUTHORIZE_URL =
            "https://connect.stripe.com/oauth/deauthorize";

    private static final String API_BASE =
            "https://api.stripe.com/v1";

    private static final int STATE_EXPIRATION_MINUTES =
            10;

    private final StripePaymentConnectionRepository
            connectionRepository;

    private final StripeConnectOAuthStateRepository
            oauthStateRepository;

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

    @Value("${stripe.connect.client-id:}")
    private String clientId;

    @Value("${stripe.connect.secret-key:}")
    private String platformSecretKey;

    @Value("${stripe.connect.publishable-key:}")
    private String platformPublishableKey;

    @Value("${stripe.connect.redirect-uri:}")
    private String redirectUri;

    @Value("${stripe.connect.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public StripeConnectService(
            StripePaymentConnectionRepository connectionRepository,
            StripeConnectOAuthStateRepository oauthStateRepository,
            CurrentStoreService currentStoreService
    ) {
        this.connectionRepository =
                connectionRepository;

        this.oauthStateRepository =
                oauthStateRepository;

        this.currentStoreService =
                currentStoreService;
    }

    @Transactional
    public String createAuthorizationUrl() {

        validateOAuthConfiguration();

        Store store =
                currentStoreService
                        .getCurrentStore();

        invalidatePreviousStates(
                store
        );

        String state =
                generateRandomValue(
                        32
                );

        StripeConnectOAuthState oauthState =
                new StripeConnectOAuthState();

        oauthState.setStore(
                store
        );

        oauthState.setState(
                state
        );

        oauthState.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(
                                STATE_EXPIRATION_MINUTES
                        )
        );

        oauthStateRepository.save(
                oauthState
        );

        UriComponentsBuilder builder =
                UriComponentsBuilder
                        .fromUriString(
                                AUTHORIZATION_URL
                        )
                        .queryParam(
                                "response_type",
                                "code"
                        )
                        .queryParam(
                                "client_id",
                                clientId.trim()
                        )
                        .queryParam(
                                "scope",
                                "read_write"
                        )
                        .queryParam(
                                "redirect_uri",
                                redirectUri.trim()
                        )
                        .queryParam(
                                "state",
                                state
                        );

        if (hasText(store.getCountryCode())) {
            builder.queryParam(
                    "stripe_user[country]",
                    store.getCountryCode()
                            .trim()
                            .toUpperCase(Locale.ROOT)
            );
        }

        if (hasText(store.getCurrencyCode())) {
            builder.queryParam(
                    "stripe_user[currency]",
                    store.getCurrencyCode()
                            .trim()
                            .toLowerCase(Locale.ROOT)
            );
        }

        if (hasText(store.getName())) {
            builder.queryParam(
                    "stripe_user[business_name]",
                    store.getName()
            );
        }

        return builder
                .build()
                .encode()
                .toUriString();
    }

    @Transactional
    public Store processCallback(
            String code,
            String state
    ) {

        validateOAuthConfiguration();

        if (!hasText(code) || !hasText(state)) {
            throw new IllegalArgumentException(
                    "Resposta OAuth Stripe inválida."
            );
        }

        StripeConnectOAuthState oauthState =
                oauthStateRepository
                        .findByStateAndUsedFalse(
                                state.trim()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "State OAuth Stripe inválido ou já utilizado."
                                        )
                        );

        if (!oauthState.isValid()) {
            oauthState.markAsUsed();
            oauthStateRepository.save(
                    oauthState
            );

            throw new IllegalArgumentException(
                    "Tentativa de conexão com Stripe expirada."
            );
        }

        oauthState.markAsUsed();
        oauthStateRepository.save(
                oauthState
        );

        JsonNode tokenResponse =
                exchangeAuthorizationCode(
                        code.trim()
                );

        String accountId =
                textValue(
                        tokenResponse,
                        "stripe_user_id"
                );

        if (
                !hasText(accountId) ||
                !accountId.startsWith("acct_")
        ) {
            throw new IllegalStateException(
                    "A Stripe não retornou a conta conectada."
            );
        }

        Store store =
                oauthState.getStore();

        JsonNode account =
                getConnectedAccount(
                        accountId
                );

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElseGet(
                                StripePaymentConnection::new
                        );

        connection.setStore(store);
        connection.setStripeAccountId(accountId);
        connection.setConnectLivemode(
                tokenResponse.path("livemode")
                        .asBoolean(false)
        );
        connection.setChargesEnabled(
                account.path("charges_enabled")
                        .asBoolean(false)
        );
        connection.setDetailsSubmitted(
                account.path("details_submitted")
                        .asBoolean(false)
        );

        connection.setRestrictedApiKeyEncrypted(null);
        connection.setWebhookSecretEncrypted(null);
        connection.setPublishableKey(null);
        connection.setKeyLast4(null);

        connection.setConnected(true);
        connection.setConnectedAt(
                LocalDateTime.now()
        );
        connection.setDisconnectedAt(null);

        connection.setPaymentDomainRegistered(
                ensurePaymentDomain(
                        accountId
                )
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

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElse(null);

        if (connection == null) {
            return;
        }

        String accountId =
                connection.getStripeAccountId();

        if (
                hasText(accountId) &&
                hasText(clientId) &&
                hasText(platformSecretKey)
        ) {
            try {
                HttpHeaders headers =
                        new HttpHeaders();

                headers.setBasicAuth(
                        platformSecretKey.trim(),
                        ""
                );
                headers.setContentType(
                        MediaType.APPLICATION_FORM_URLENCODED
                );

                MultiValueMap<String, String> form =
                        new LinkedMultiValueMap<>();

                form.add(
                        "client_id",
                        clientId.trim()
                );
                form.add(
                        "stripe_user_id",
                        accountId
                );

                restTemplate.exchange(
                        DEAUTHORIZE_URL,
                        HttpMethod.POST,
                        new HttpEntity<>(
                                form,
                                headers
                        ),
                        JsonNode.class
                );

            } catch (RuntimeException ignored) {
            }
        }

        connection.setStripeAccountId(null);
        connection.setConnectLivemode(false);
        connection.setChargesEnabled(false);
        connection.setDetailsSubmitted(false);
        connection.setPaymentDomainRegistered(false);
        connection.setConnected(false);
        connection.setDisconnectedAt(
                LocalDateTime.now()
        );

        connectionRepository.save(
                connection
        );
    }

    @Transactional(readOnly = true)
    public boolean isConnected(
            Long storeId
    ) {
        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .filter(
                        connection ->
                                hasText(
                                        connection.getStripeAccountId()
                                )
                )
                .isPresent();
    }

    @Transactional(readOnly = true)
    public boolean isPaymentReady(
            Long storeId
    ) {
        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .filter(
                        connection ->
                                hasText(
                                        connection.getStripeAccountId()
                                )
                                && connection.isChargesEnabled()
                )
                .isPresent()
                && isServerConfigured();
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
                                        connection.getStripeAccountId()
                                )
                                && connection.isChargesEnabled()
                                && connection.isPaymentDomainRegistered()
                )
                .isPresent()
                && isClientConfigured();
    }

    @Transactional(readOnly = true)
    public String getConnectedAccountId(
            Long storeId
    ) {
        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .map(
                        StripePaymentConnection::getStripeAccountId
                )
                .filter(
                        this::hasText
                )
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "Conta Stripe Connect não vinculada a esta loja."
                                )
                );
    }

    @Transactional(readOnly = true)
    public Long getStoreIdForAccount(
            String accountId
    ) {
        return connectionRepository
                .findByStripeAccountIdAndConnectedTrue(
                        accountId
                )
                .map(
                        connection ->
                                connection.getStore()
                                        .getId()
                )
                .orElse(null);
    }

    @Transactional
    public void updateConnectedAccountStatus(
            String accountId,
            boolean chargesEnabled,
            boolean detailsSubmitted
    ) {

        if (
                !hasText(
                        accountId
                )
        ) {
            return;
        }

        StripePaymentConnection connection =
                connectionRepository
                        .findByStripeAccountIdAndConnectedTrue(
                                accountId
                        )
                        .orElse(
                                null
                        );

        if (
                connection == null
        ) {
            return;
        }

        connection.setChargesEnabled(
                chargesEnabled
        );

        connection.setDetailsSubmitted(
                detailsSubmitted
        );

        if (
                !connection.isPaymentDomainRegistered()
        ) {
            connection.setPaymentDomainRegistered(
                    ensurePaymentDomain(
                            accountId
                    )
            );
        }

        connectionRepository.save(
                connection
        );
    }

    @Transactional
    public void markDisconnectedByAccountId(
            String accountId
    ) {

        if (
                !hasText(
                        accountId
                )
        ) {
            return;
        }

        StripePaymentConnection connection =
                connectionRepository
                        .findByStripeAccountIdAndConnectedTrue(
                                accountId
                        )
                        .orElse(
                                null
                        );

        if (
                connection == null
        ) {
            return;
        }

        connection.setStripeAccountId(
                null
        );

        connection.setConnectLivemode(
                false
        );

        connection.setChargesEnabled(
                false
        );

        connection.setDetailsSubmitted(
                false
        );

        connection.setPaymentDomainRegistered(
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

    public String getPlatformSecretKey() {
        if (!hasText(platformSecretKey)) {
            throw new IllegalStateException(
                    "STRIPE_CONNECT_SECRET_KEY não configurada."
            );
        }

        return platformSecretKey.trim();
    }

    public String getPlatformPublishableKey() {
        if (!hasText(platformPublishableKey)) {
            throw new IllegalStateException(
                    "STRIPE_CONNECT_PUBLISHABLE_KEY não configurada."
            );
        }

        return platformPublishableKey.trim();
    }

    public String getPlatformWebhookSecret() {
        if (!hasText(webhookSecret)) {
            throw new IllegalStateException(
                    "STRIPE_CONNECT_WEBHOOK_SECRET não configurado."
            );
        }

        return webhookSecret.trim();
    }

    public boolean isServerConfigured() {
        return hasText(platformSecretKey);
    }

    public boolean isClientConfigured() {
        return isServerConfigured()
                && hasText(platformPublishableKey);
    }

    private JsonNode exchangeAuthorizationCode(
            String code
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBasicAuth(
                getPlatformSecretKey(),
                ""
        );
        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "grant_type",
                "authorization_code"
        );
        form.add(
                "code",
                code
        );

        try {
            ResponseEntity<JsonNode> response =
                    restTemplate.exchange(
                            TOKEN_URL,
                            HttpMethod.POST,
                            new HttpEntity<>(
                                    form,
                                    headers
                            ),
                            JsonNode.class
                    );

            if (response.getBody() == null) {
                throw new IllegalStateException(
                        "A Stripe não retornou a autorização."
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

    private JsonNode getConnectedAccount(
            String accountId
    ) {
        return connectedGet(
                "/account",
                accountId
        );
    }

    private boolean ensurePaymentDomain(
            String accountId
    ) {

        String domain =
                frontendDomain();

        if (!hasText(domain)) {
            return false;
        }

        try {
            JsonNode domains =
                    connectedGet(
                            "/payment_method_domains?limit=100",
                            accountId
                    );

            for (
                    JsonNode item :
                    domains.path("data")
            ) {
                if (
                        domain.equalsIgnoreCase(
                                item.path("domain_name")
                                        .asText()
                        )
                ) {
                    return item.path("enabled")
                            .asBoolean(true);
                }
            }

            MultiValueMap<String, String> form =
                    new LinkedMultiValueMap<>();

            form.add(
                    "domain_name",
                    domain
            );

            JsonNode created =
                    connectedPostForm(
                            "/payment_method_domains",
                            form,
                            accountId
                    );

            return domain.equalsIgnoreCase(
                    created.path("domain_name")
                            .asText()
            );

        } catch (RuntimeException exception) {
            return false;
        }
    }

    private JsonNode connectedGet(
            String path,
            String accountId
    ) {

        HttpHeaders headers =
                connectedHeaders(
                        accountId
                );

        try {
            ResponseEntity<JsonNode> response =
                    restTemplate.exchange(
                            API_BASE + path,
                            HttpMethod.GET,
                            new HttpEntity<>(
                                    headers
                            ),
                            JsonNode.class
                    );

            if (response.getBody() == null) {
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

    private JsonNode connectedPostForm(
            String path,
            MultiValueMap<String, String> form,
            String accountId
    ) {

        HttpHeaders headers =
                connectedHeaders(
                        accountId
                );

        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        try {
            ResponseEntity<JsonNode> response =
                    restTemplate.exchange(
                            API_BASE + path,
                            HttpMethod.POST,
                            new HttpEntity<>(
                                    form,
                                    headers
                            ),
                            JsonNode.class
                    );

            if (response.getBody() == null) {
                throw new IllegalStateException(
                        "A Stripe não retornou uma resposta vazia."
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

    private HttpHeaders connectedHeaders(
            String accountId
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                getPlatformSecretKey()
        );
        headers.set(
                "Stripe-Account",
                accountId
        );
        headers.setAccept(
                List.of(
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
                    payload.path("error")
                            .path("message")
                            .asText();

            if (hasText(stripeMessage)) {
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

    private void invalidatePreviousStates(
            Store store
    ) {

        List<StripeConnectOAuthState> states =
                oauthStateRepository
                        .findAllByStoreAndUsedFalse(
                                store
                        );

        for (
                StripeConnectOAuthState oauthState :
                states
        ) {
            oauthState.markAsUsed();
        }

        if (!states.isEmpty()) {
            oauthStateRepository.saveAll(
                    states
            );
        }
    }

    private String frontendDomain() {

        try {
            URI uri =
                    URI.create(
                            frontendUrl.trim()
                    );

            String host =
                    uri.getHost();

            if (
                    host == null ||
                    "localhost".equalsIgnoreCase(host) ||
                    "127.0.0.1".equals(host)
            ) {
                return null;
            }

            return host;

        } catch (Exception exception) {
            return null;
        }
    }

    private String generateRandomValue(
            int bytesCount
    ) {

        byte[] bytes =
                new byte[bytesCount];

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

    private String textValue(
            JsonNode node,
            String field
    ) {

        JsonNode value =
                node.get(field);

        if (
                value == null ||
                value.isNull()
        ) {
            return null;
        }

        String text =
                value.asText();

        return hasText(text)
                ? text.trim()
                : null;
    }

    private void validateOAuthConfiguration() {

        if (!hasText(clientId)) {
            throw new IllegalStateException(
                    "STRIPE_CONNECT_CLIENT_ID não configurado."
            );
        }

        getPlatformSecretKey();
        getPlatformPublishableKey();

        if (!hasText(redirectUri)) {
            throw new IllegalStateException(
                    "STRIPE_CONNECT_REDIRECT_URI não configurada."
            );
        }

        if (
                !redirectUri.startsWith("https://") &&
                !redirectUri.startsWith("http://localhost")
        ) {
            throw new IllegalStateException(
                    "STRIPE_CONNECT_REDIRECT_URI precisa usar HTTPS em produção."
            );
        }
    }

    private boolean hasText(
            String value
    ) {
        return value != null
                && !value.isBlank();
    }
}
