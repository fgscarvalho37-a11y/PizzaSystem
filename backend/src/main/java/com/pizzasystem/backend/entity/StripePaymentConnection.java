package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "stripe_payment_connections",
        indexes = {
                @Index(
                        name = "idx_stripe_connection_store",
                        columnList = "store_id"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_stripe_connection_store",
                        columnNames = "store_id"
                )
        }
)
public class StripePaymentConnection {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

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

    @Column(
            name = "restricted_api_key_encrypted",
            columnDefinition = "TEXT"
    )
    private String restrictedApiKeyEncrypted;

    @Column(
            name = "webhook_secret_encrypted",
            columnDefinition = "TEXT"
    )
    private String webhookSecretEncrypted;

    @Column(
            name = "publishable_key",
            length = 255
    )
    private String publishableKey;

    @Column(
            name = "key_last4",
            length = 4
    )
    private String keyLast4;

    @Column(
            nullable = false
    )
    private boolean connected =
            false;

    private LocalDateTime connectedAt;

    private LocalDateTime disconnectedAt;

    @Column(
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    private void updateTimestamp() {
        updatedAt =
                LocalDateTime.now();
    }

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

    public String getRestrictedApiKeyEncrypted() {
        return restrictedApiKeyEncrypted;
    }

    public void setRestrictedApiKeyEncrypted(
            String restrictedApiKeyEncrypted
    ) {
        this.restrictedApiKeyEncrypted =
                restrictedApiKeyEncrypted;
    }

    public String getWebhookSecretEncrypted() {
        return webhookSecretEncrypted;
    }

    public void setWebhookSecretEncrypted(
            String webhookSecretEncrypted
    ) {
        this.webhookSecretEncrypted =
                webhookSecretEncrypted;
    }

    public String getPublishableKey() {
        return publishableKey;
    }

    public void setPublishableKey(
            String publishableKey
    ) {
        this.publishableKey =
                publishableKey;
    }

    public String getKeyLast4() {
        return keyLast4;
    }

    public void setKeyLast4(
            String keyLast4
    ) {
        this.keyLast4 =
                keyLast4;
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
