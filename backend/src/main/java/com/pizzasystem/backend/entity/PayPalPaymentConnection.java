package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "paypal_payment_connections",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_paypal_payment_store",
                        columnNames = "store_id"
                )
        }
)
public class PayPalPaymentConnection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false, unique = true)
    private Store store;

    @Column(name = "client_id", nullable = false, length = 300)
    private String clientId;

    @Column(name = "client_secret_encrypted", columnDefinition = "TEXT")
    private String clientSecretEncrypted;

    @Column(name = "client_id_last4", length = 4)
    private String clientIdLast4;

    @Column(nullable = false)
    private boolean sandbox = false;

    @Column(nullable = false)
    private boolean connected = false;

    private LocalDateTime connectedAt;
    private LocalDateTime disconnectedAt;

    public Long getId() { return id; }
    public Store getStore() { return store; }
    public void setStore(Store store) { this.store = store; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public String getClientSecretEncrypted() { return clientSecretEncrypted; }
    public void setClientSecretEncrypted(String value) { this.clientSecretEncrypted = value; }
    public String getClientIdLast4() { return clientIdLast4; }
    public void setClientIdLast4(String value) { this.clientIdLast4 = value; }
    public boolean isSandbox() { return sandbox; }
    public void setSandbox(boolean sandbox) { this.sandbox = sandbox; }
    public boolean isConnected() { return connected; }
    public void setConnected(boolean connected) { this.connected = connected; }
    public LocalDateTime getConnectedAt() { return connectedAt; }
    public void setConnectedAt(LocalDateTime connectedAt) { this.connectedAt = connectedAt; }
    public LocalDateTime getDisconnectedAt() { return disconnectedAt; }
    public void setDisconnectedAt(LocalDateTime disconnectedAt) { this.disconnectedAt = disconnectedAt; }
}
