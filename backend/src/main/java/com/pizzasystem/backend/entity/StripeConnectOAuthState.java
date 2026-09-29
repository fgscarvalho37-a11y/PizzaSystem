package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "stripe_connect_oauth_states",
        indexes = {
                @Index(
                        name = "idx_stripe_connect_oauth_state",
                        columnList = "state"
                ),
                @Index(
                        name = "idx_stripe_connect_oauth_store",
                        columnList = "store_id"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_stripe_connect_oauth_state",
                        columnNames = "state"
                )
        }
)
public class StripeConnectOAuthState {

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
            length = 120
    )
    private String state;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    private LocalDateTime usedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

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

    public void setStore(Store store) {
        this.store = store;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
