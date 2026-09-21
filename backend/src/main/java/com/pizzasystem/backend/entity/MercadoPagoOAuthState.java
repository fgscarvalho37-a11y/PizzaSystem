package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "mercado_pago_oauth_states",
        indexes = {
                @Index(
                        name = "idx_mp_oauth_state",
                        columnList = "state"
                ),
                @Index(
                        name = "idx_mp_oauth_state_store",
                        columnList = "store_id"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_mp_oauth_state",
                        columnNames = "state"
                )
        }
)
public class MercadoPagoOAuthState {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "store_id",
            nullable = false
    )
    private Store store;

    @Column(
            nullable = false,
            unique = true,
            length = 100
    )
    private String state;

    @Column(
            name = "code_verifier",
            nullable = false,
            length = 128
    )
    private String codeVerifier;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    private LocalDateTime usedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    public MercadoPagoOAuthState() {
    }

    public boolean isExpired() {
        return expiresAt == null
                || LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used
                && !isExpired();
    }

    public void markAsUsed() {
        used = true;
        usedAt = LocalDateTime.now();
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
        this.store = store;
    }

    public String getState() {
        return state;
    }

    public void setState(
            String state
    ) {
        this.state = state;
    }

    public String getCodeVerifier() {
        return codeVerifier;
    }

    public void setCodeVerifier(
            String codeVerifier
    ) {
        this.codeVerifier = codeVerifier;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(
            LocalDateTime expiresAt
    ) {
        this.expiresAt = expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(
            boolean used
    ) {
        this.used = used;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}