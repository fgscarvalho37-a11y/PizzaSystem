package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "mercado_pago_connections",
        indexes = {
                @Index(
                        name = "idx_mp_connection_store",
                        columnList = "store_id"
                ),
                @Index(
                        name = "idx_mp_connection_user",
                        columnList = "mercado_pago_user_id"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_mp_connection_store",
                        columnNames = "store_id"
                )
        }
)
public class MercadoPagoConnection {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // LOJA
    // =========================

    @OneToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "store_id",
            nullable = false,
            unique = true
    )
    private Store store;

    // =========================
    // MERCADO PAGO
    // =========================

    @Column(
            name = "mercado_pago_user_id",
            length = 100
    )
    private String mercadoPagoUserId;

    @Column(
            name = "access_token",
            columnDefinition = "TEXT"
    )
    private String accessToken;

    @Column(
            name = "refresh_token",
            columnDefinition = "TEXT"
    )
    private String refreshToken;

    @Column(length = 50)
    private String tokenType;

    @Column(length = 500)
    private String scope;

    private LocalDateTime tokenExpiresAt;

    // =========================
    // STATUS
    // =========================

    @Column(nullable = false)
    private boolean connected = false;

    private LocalDateTime connectedAt;

    private LocalDateTime disconnectedAt;

    // =========================
    // DATAS
    // =========================

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    private LocalDateTime updatedAt;

    public MercadoPagoConnection() {
    }

    @PreUpdate
    private void updateTimestamp() {
        updatedAt =
                LocalDateTime.now();
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(
            Store store
    ) {
        this.store =
                store;
    }

    public String getMercadoPagoUserId() {
        return mercadoPagoUserId;
    }

    public void setMercadoPagoUserId(
            String mercadoPagoUserId
    ) {
        this.mercadoPagoUserId =
                mercadoPagoUserId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(
            String accessToken
    ) {
        this.accessToken =
                accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(
            String refreshToken
    ) {
        this.refreshToken =
                refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(
            String tokenType
    ) {
        this.tokenType =
                tokenType;
    }

    public String getScope() {
        return scope;
    }

    public void setScope(
            String scope
    ) {
        this.scope =
                scope;
    }

    public LocalDateTime getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public void setTokenExpiresAt(
            LocalDateTime tokenExpiresAt
    ) {
        this.tokenExpiresAt =
                tokenExpiresAt;
    }

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(
            boolean connected
    ) {
        this.connected =
                connected;
    }

    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(
            LocalDateTime connectedAt
    ) {
        this.connectedAt =
                connectedAt;
    }

    public LocalDateTime getDisconnectedAt() {
        return disconnectedAt;
    }

    public void setDisconnectedAt(
            LocalDateTime disconnectedAt
    ) {
        this.disconnectedAt =
                disconnectedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}