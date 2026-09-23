package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;

import com.pizzasystem.backend.entity.MercadoPagoConnection;
import com.pizzasystem.backend.entity.MercadoPagoOAuthState;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.MercadoPagoConnectionRepository;
import com.pizzasystem.backend.repository.MercadoPagoOAuthStateRepository;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;
import java.security.SecureRandom;

import java.time.LocalDateTime;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MercadoPagoOAuthService {

    private static final String AUTHORIZATION_URL =
            "https://auth.mercadopago.com/authorization";

    private static final String TOKEN_URL =
            "https://api.mercadopago.com/oauth/token";

    private static final int STATE_EXPIRATION_MINUTES = 10;

    private final MercadoPagoConnectionRepository
            connectionRepository;

    private final MercadoPagoOAuthStateRepository
            oauthStateRepository;

    private final CurrentStoreService
            currentStoreService;

    private final RestTemplate
            restTemplate;

    private final SecureRandom
            secureRandom;

    @Value("${mercadopago.oauth.client-id:}")
    private String clientId;

    @Value("${mercadopago.oauth.client-secret:}")
    private String clientSecret;

    @Value("${mercadopago.oauth.redirect-uri:}")
    private String redirectUri;

    public MercadoPagoOAuthService(
            MercadoPagoConnectionRepository connectionRepository,
            MercadoPagoOAuthStateRepository oauthStateRepository,
            CurrentStoreService currentStoreService
    ) {
        this.connectionRepository =
                connectionRepository;

        this.oauthStateRepository =
                oauthStateRepository;

        this.currentStoreService =
                currentStoreService;

        this.restTemplate =
                new RestTemplate();

        this.secureRandom =
                new SecureRandom();
    }

    // =========================
    // STATUS
    // =========================

    @Transactional(readOnly = true)
    public Map<String, Object> getConnectionStatus() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        MercadoPagoConnection connection =
                connectionRepository
                        .findByStoreId(store.getId())
                        .orElse(null);

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "connected",
                connection != null
                        && connection.isConnected()
                        && connection.getAccessToken() != null
                        && !connection.getAccessToken().isBlank()
        );

        response.put(
                "cardPaymentsReady",
                connection != null
                        && connection.isConnected()
                        && connection.getAccessToken() != null
                        && !connection.getAccessToken().isBlank()
                        && connection.getPublicKey() != null
                        && !connection.getPublicKey().isBlank()
        );

        if (connection != null) {

            response.put(
                    "mercadoPagoUserId",
                    connection.getMercadoPagoUserId()
            );

            response.put(
                    "connectedAt",
                    connection.getConnectedAt()
            );

            response.put(
                    "tokenExpiresAt",
                    connection.getTokenExpiresAt()
            );
        }

        return response;
    }

    // =========================
    // INICIAR OAUTH
    // =========================

    @Transactional
    public String createAuthorizationUrl() {

        validateConfiguration();

        Store store =
                currentStoreService
                        .getCurrentStore();

        invalidatePreviousStates(
                store
        );

        String state =
                generateRandomValue(32);

        String codeVerifier =
                generateRandomValue(64);

        String codeChallenge =
                createCodeChallenge(
                        codeVerifier
                );

        MercadoPagoOAuthState oauthState =
                new MercadoPagoOAuthState();

        oauthState.setStore(
                store
        );

        oauthState.setState(
                state
        );

        oauthState.setCodeVerifier(
                codeVerifier
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

        return UriComponentsBuilder
                .fromUriString(
                        AUTHORIZATION_URL
                )
                .queryParam(
                        "response_type",
                        "code"
                )
                .queryParam(
                        "client_id",
                        clientId
                )
                .queryParam(
                        "redirect_uri",
                        redirectUri
                )
                .queryParam(
                        "state",
                        state
                )
                .queryParam(
                        "code_challenge",
                        codeChallenge
                )
                .queryParam(
                        "code_challenge_method",
                        "S256"
                )
                .build()
                .encode()
                .toUriString();
    }

    // =========================
    // CALLBACK
    // =========================

    @Transactional
    public Store processCallback(
            String code,
            String state
    ) {

        validateConfiguration();

        if (code == null
                || code.isBlank()) {

            throw new IllegalArgumentException(
                    "Código de autorização do Mercado Pago não informado."
            );
        }

        if (state == null
                || state.isBlank()) {

            throw new IllegalArgumentException(
                    "State OAuth não informado."
            );
        }

        MercadoPagoOAuthState oauthState =
                oauthStateRepository
                        .findByStateAndUsedFalse(
                                state.trim()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "State OAuth inválido ou já utilizado."
                                )
                        );

        if (!oauthState.isValid()) {

            oauthState.markAsUsed();

            oauthStateRepository.save(
                    oauthState
            );

            throw new IllegalArgumentException(
                    "Tentativa de conexão com Mercado Pago expirada."
            );
        }

        /*
         * Marcamos antes da chamada externa para impedir
         * reutilização do mesmo state/código.
         */
        oauthState.markAsUsed();

        oauthStateRepository.save(
                oauthState
        );

        JsonNode tokenResponse =
                exchangeAuthorizationCode(
                        code.trim(),
                        oauthState.getCodeVerifier()
                );

        Store store =
                oauthState.getStore();

        saveConnection(
                store,
                tokenResponse
        );

        return store;
    }

    // =========================
    // DESCONECTAR
    // =========================

    @Transactional
    public void disconnect() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        MercadoPagoConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElse(null);

        if (connection == null) {
            return;
        }

        /*
         * Não mantemos credenciais utilizáveis após
         * a desconexão local.
         */
        connection.setPublicKey(
                null
        );

        connection.setAccessToken(
                null
        );

        connection.setRefreshToken(
                null
        );

        connection.setConnected(
                false
        );

        connection.setDisconnectedAt(
                LocalDateTime.now()
        );

        connection.setTokenExpiresAt(
                null
        );

        connectionRepository.save(
                connection
        );
    }

    // =========================
    // ACCESS TOKEN DA LOJA
    // =========================

    @Transactional(readOnly = true)
    public String getAccessTokenForStore(
            Long storeId
    ) {

        MercadoPagoConnection connection =
                getConnectedConnection(
                        storeId
                );

        String accessToken =
                connection.getAccessToken();

        if (accessToken == null
                || accessToken.isBlank()) {

            throw new IllegalStateException(
                    "Access Token do Mercado Pago não disponível para esta loja."
            );
        }

        return accessToken.trim();
    }

    // =========================
    // PUBLIC KEY DA LOJA
    // =========================

    @Transactional(readOnly = true)
    public String getPublicKeyForStore(
            Long storeId
    ) {

        MercadoPagoConnection connection =
                getConnectedConnection(
                        storeId
                );

        String publicKey =
                connection.getPublicKey();

        if (publicKey == null
                || publicKey.isBlank()) {

            throw new IllegalStateException(
                    "Public Key do Mercado Pago não disponível para esta loja. Reconecte a conta do Mercado Pago."
            );
        }

        return publicKey.trim();
    }

    // =========================
    // CONEXÃO DA LOJA
    // =========================

    private MercadoPagoConnection getConnectedConnection(
            Long storeId
    ) {

        if (storeId == null) {

            throw new IllegalArgumentException(
                    "Loja não informada."
            );
        }

        return connectionRepository
                .findByStoreIdAndConnectedTrue(
                        storeId
                )
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Mercado Pago não está conectado para esta loja."
                        )
                );
    }

    // =========================
    // TROCAR CODE POR TOKEN
    // =========================

    private JsonNode exchangeAuthorizationCode(
            String code,
            String codeVerifier
    ) {

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        Map<String, Object> body =
                new HashMap<>();

        body.put(
                "client_id",
                clientId
        );

        body.put(
                "client_secret",
                clientSecret
        );

        body.put(
                "grant_type",
                "authorization_code"
        );

        body.put(
                "code",
                code
        );

        body.put(
                "redirect_uri",
                redirectUri
        );

        body.put(
                "code_verifier",
                codeVerifier
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(
                        body,
                        headers
                );

        JsonNode response =
                restTemplate.postForObject(
                        TOKEN_URL,
                        request,
                        JsonNode.class
                );

        if (response == null) {

            throw new IllegalStateException(
                    "Mercado Pago não retornou os dados da autorização."
            );
        }

        String accessToken =
                getText(
                        response,
                        "access_token"
                );

        if (accessToken == null
                || accessToken.isBlank()) {

            throw new IllegalStateException(
                    "Mercado Pago não retornou Access Token."
            );
        }

        return response;
    }

    // =========================
    // SALVAR CONEXÃO
    // =========================

    private void saveConnection(
            Store store,
            JsonNode tokenResponse
    ) {

        MercadoPagoConnection connection =
                connectionRepository
                        .findByStoreId(
                                store.getId()
                        )
                        .orElseGet(
                                MercadoPagoConnection::new
                        );

        connection.setStore(
                store
        );

        /*
         * A resposta OAuth também contém a Public Key
         * vinculada à conta autorizada.
         *
         * Ela será usada pelo frontend para inicializar
         * o SDK do Mercado Pago e tokenizar cartões.
         */
        connection.setPublicKey(
                getText(
                        tokenResponse,
                        "public_key"
                )
        );

        connection.setAccessToken(
                getText(
                        tokenResponse,
                        "access_token"
                )
        );

        connection.setRefreshToken(
                getText(
                        tokenResponse,
                        "refresh_token"
                )
        );

        connection.setTokenType(
                getText(
                        tokenResponse,
                        "token_type"
                )
        );

        connection.setScope(
                getText(
                        tokenResponse,
                        "scope"
                )
        );

        JsonNode userId =
                tokenResponse.get(
                        "user_id"
                );

        if (userId != null
                && !userId.isNull()) {

            connection.setMercadoPagoUserId(
                    userId.asText()
            );
        }

        JsonNode expiresIn =
                tokenResponse.get(
                        "expires_in"
                );

        if (expiresIn != null
                && expiresIn.canConvertToLong()) {

            connection.setTokenExpiresAt(
                    LocalDateTime.now()
                            .plusSeconds(
                                    expiresIn.asLong()
                            )
            );

        } else {

            connection.setTokenExpiresAt(
                    null
            );
        }

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
    }

    // =========================
    // INVALIDAR STATES ANTIGOS
    // =========================

    private void invalidatePreviousStates(
            Store store
    ) {

        List<MercadoPagoOAuthState> states =
                oauthStateRepository
                        .findAllByStoreAndUsedFalse(
                                store
                        );

        for (MercadoPagoOAuthState oauthState
                : states) {

            oauthState.markAsUsed();
        }

        if (!states.isEmpty()) {

            oauthStateRepository.saveAll(
                    states
            );
        }
    }

    // =========================
    // PKCE
    // =========================

    private String createCodeChallenge(
            String codeVerifier
    ) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance(
                            "SHA-256"
                    );

            byte[] hash =
                    digest.digest(
                            codeVerifier.getBytes(
                                    StandardCharsets.US_ASCII
                            )
                    );

            return Base64
                    .getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(
                            hash
                    );

        } catch (Exception exception) {

            throw new IllegalStateException(
                    "Não foi possível gerar o PKCE do Mercado Pago.",
                    exception
            );
        }
    }

    private String generateRandomValue(
            int numberOfBytes
    ) {

        byte[] bytes =
                new byte[numberOfBytes];

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

    // =========================
    // HELPERS
    // =========================

    private String getText(
            JsonNode node,
            String field
    ) {

        JsonNode value =
                node.get(
                        field
                );

        if (value == null
                || value.isNull()) {

            return null;
        }

        String text =
                value.asText();

        if (text == null
                || text.isBlank()) {

            return null;
        }

        return text.trim();
    }

    private void validateConfiguration() {

        if (clientId == null
                || clientId.isBlank()) {

            throw new IllegalStateException(
                    "MERCADOPAGO_CLIENT_ID não configurado."
            );
        }

        if (clientSecret == null
                || clientSecret.isBlank()) {

            throw new IllegalStateException(
                    "MERCADOPAGO_CLIENT_SECRET não configurado."
            );
        }

        if (redirectUri == null
                || redirectUri.isBlank()) {

            throw new IllegalStateException(
                    "MERCADOPAGO_REDIRECT_URI não configurado."
            );
        }
    }
}
