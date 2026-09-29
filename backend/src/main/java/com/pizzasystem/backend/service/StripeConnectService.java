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
import java.net.URI;

import java.security.SecureRandom;

import java.time.LocalDateTime;

import java.util.Base64;
import java.util.List;

@Service
public class StripeConnectService {

    private static final String API_BASE =
            "https://api.stripe.com/v1";

    private static final int STATE_EXPIRATION_MINUTES =
            30;

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

    @Value("${stripe.connect.secret-key:}")
    private String platformSecretKey;

    @Value("${stripe.connect.publishable-key:}")
    private String platformPublishableKey;

    @Value("${stripe.connect.webhook-secret:}")
    private String webhookSecret;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${stripe.connect.onboarding-return-uri:https://pizzasystem-api.onrender.com/api/admin/stripe-payment/onboarding/return}")
    private String onboardingReturnUri;

    @Value("${stripe.connect.onboarding-refresh-uri:https://pizzasystem-api.onrender.com/api/admin/stripe-payment/onboarding/refresh}")
    private String onboardingRefreshUri;

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

        validateHostedOnboardingConfiguration();

        Store store =
                currentStoreService
                        .getCurrentStore();

        invalidatePreviousStates(
                store
        );

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElseGet(
                                StripePaymentConnection::new
                        );

        String accountId =
                connection.getStripeAccountId();

        if (
                !hasText(
                        accountId
                )
        ) {
            JsonNode account =
                    createConnectedAccount(
                            store
                    );

            accountId =
                    textValue(
                            account,
                            "id"
                    );

            if (
                    !hasText(
                            accountId
                    ) ||
                    !accountId.startsWith(
                            "acct_"
                    )
            ) {
                throw new IllegalStateException(
                        "A Stripe não retornou uma conta conectada válida."
                );
            }

            connection.setStore(
                    store
            );

            connection.setStripeAccountId(
                    accountId
            );

            connection.setConnectLivemode(
                    getPlatformSecretKey()
                            .startsWith(
                                    "sk_live_"
                            )
            );

            connection.setChargesEnabled(
                    account.path(
                            "charges_enabled"
                    )
                            .asBoolean(
                                    false
                            )
            );

            connection.setDetailsSubmitted(
                    account.path(
                            "details_submitted"
                    )
                            .asBoolean(
                                    false
                            )
            );

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

        } else {
            connection.setConnected(
                    true
            );

            connection.setDisconnectedAt(
                    null
            );

            connectionRepository.save(
                    connection
            );
        }

        String state =
                generateRandomValue(
                        32
                );

        StripeConnectOAuthState onboardingState =
                new StripeConnectOAuthState();

        onboardingState.setStore(
                store
        );

        onboardingState.setState(
                state
        );

        onboardingState.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(
                                STATE_EXPIRATION_MINUTES
                        )
        );

        oauthStateRepository.save(
                onboardingState
        );

        return createAccountLink(
                accountId,
                state
        );
    }

    @Transactional
    public Store processOnboardingReturn(
            String state
    ) {

        validateHostedOnboardingConfiguration();

        StripeConnectOAuthState onboardingState =
                getValidOnboardingState(
                        state
                );

        Store store =
                onboardingState
                        .getStore();

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalStateException(
                                                "Conta Stripe Connect não encontrada para esta loja."
                                        )
                        );

        String accountId =
                connection.getStripeAccountId();

        if (
                !hasText(
                        accountId
                )
        ) {
            throw new IllegalStateException(
                    "Conta Stripe Connect não encontrada para esta loja."
            );
        }

        JsonNode account =
                getConnectedAccount(
                        accountId
                );

        connection.setChargesEnabled(
                account.path(
                        "charges_enabled"
                )
                        .asBoolean(
                                false
                        )
        );

        connection.setDetailsSubmitted(
                account.path(
                        "details_submitted"
                )
                        .asBoolean(
                                false
                        )
        );

        connection.setConnected(
                true
        );

        if (
                connection.getConnectedAt() ==
                null
        ) {
            connection.setConnectedAt(
                    LocalDateTime.now()
            );
        }

        connection.setDisconnectedAt(
                null
        );

        if (
                connection.isChargesEnabled()
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

        onboardingState.markAsUsed();

        oauthStateRepository.save(
                onboardingState
        );

        return store;
    }

    @Transactional(readOnly = true)
    public String refreshOnboardingUrl(
            String state
    ) {

        validateHostedOnboardingConfiguration();

        StripeConnectOAuthState onboardingState =
                getValidOnboardingState(
                        state
                );

        StripePaymentConnection connection =
                connectionRepository
                        .findByStoreId(
                                onboardingState
                                        .getStore()
                                        .getId()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalStateException(
                                                "Conta Stripe Connect não encontrada para esta loja."
                                        )
                        );

        if (
                !hasText(
                        connection.getStripeAccountId()
                )
        ) {
            throw new IllegalStateException(
                    "Conta Stripe Connect não encontrada para esta loja."
            );
        }

        return createAccountLink(
                connection.getStripeAccountId(),
                state.trim()
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

        if (
                connection == null
        ) {
            return;
        }

        connection.setConnected(
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

    private JsonNode createConnectedAccount(
            Store store
    ) {

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "type",
                "standard"
        );

        if (
                hasText(
                        store.getCountryCode()
                )
        ) {
            form.add(
                    "country",
                    store.getCountryCode()
                            .trim()
                            .toUpperCase()
            );
        }

        if (
                hasText(
                        store.getName()
                )
        ) {
            form.add(
                    "business_profile[name]",
                    store.getName()
            );
        }

        return platformPostForm(
                "/accounts",
                form
        );
    }

    private String createAccountLink(
            String accountId,
            String state
    ) {

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "account",
                accountId
        );

        form.add(
                "type",
                "account_onboarding"
        );

        form.add(
                "return_url",
                appendState(
                        onboardingReturnUri,
                        state
                )
        );

        form.add(
                "refresh_url",
                appendState(
                        onboardingRefreshUri,
                        state
                )
        );

        JsonNode response =
                platformPostForm(
                        "/account_links",
                        form
                );

        String url =
                textValue(
                        response,
                        "url"
                );

        if (
                !hasText(
                        url
                )
        ) {
            throw new IllegalStateException(
                    "A Stripe não retornou a página de cadastro da conta."
            );
        }

        return url;
    }

    private StripeConnectOAuthState
    getValidOnboardingState(
            String state
    ) {

        if (
                !hasText(
                        state
                )
        ) {
            throw new IllegalArgumentException(
                    "Identificador do onboarding Stripe não informado."
            );
        }

        StripeConnectOAuthState onboardingState =
                oauthStateRepository
                        .findByStateAndUsedFalse(
                                state.trim()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Onboarding Stripe inválido ou já utilizado."
                                        )
                        );

        if (
                !onboardingState.isValid()
        ) {
            onboardingState.markAsUsed();

            oauthStateRepository.save(
                    onboardingState
            );

            throw new IllegalArgumentException(
                    "Onboarding Stripe expirado."
            );
        }

        return onboardingState;
    }

    private String appendState(
            String baseUrl,
            String state
    ) {

        String separator =
                baseUrl.contains(
                        "?"
                )
                        ? "&"
                        : "?";

        return baseUrl
                + separator
                + "state="
                + state;
    }

    private JsonNode platformPostForm(
            String path,
            MultiValueMap<String, String> form
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                getPlatformSecretKey()
        );

        headers.setContentType(
                MediaType.APPLICATION_FORM_URLENCODED
        );

        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
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

    private JsonNode platformGet(
            String path
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setBearerAuth(
                getPlatformSecretKey()
        );

        headers.setAccept(
                List.of(
                        MediaType.APPLICATION_JSON
                )
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

    private JsonNode getConnectedAccount(
            String accountId
    ) {
        return platformGet(
                "/accounts/"
                        + accountId
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

    private void validateHostedOnboardingConfiguration() {

        getPlatformSecretKey();
        getPlatformPublishableKey();

        validateHttpsUrl(
                onboardingReturnUri,
                "STRIPE_CONNECT_ONBOARDING_RETURN_URI"
        );

        validateHttpsUrl(
                onboardingRefreshUri,
                "STRIPE_CONNECT_ONBOARDING_REFRESH_URI"
        );
    }

    private void validateHttpsUrl(
            String value,
            String name
    ) {

        if (
                !hasText(
                        value
                )
        ) {
            throw new IllegalStateException(
                    name
                            + " não configurada."
            );
        }

        if (
                !value.startsWith(
                        "https://"
                ) &&
                !value.startsWith(
                        "http://localhost"
                )
        ) {
            throw new IllegalStateException(
                    name
                            + " precisa usar HTTPS em produção."
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
