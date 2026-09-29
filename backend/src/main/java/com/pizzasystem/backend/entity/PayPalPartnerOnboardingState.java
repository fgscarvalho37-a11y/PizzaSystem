package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "paypal_partner_onboarding_states",
        indexes = {
                @Index(
                        name = "idx_paypal_partner_tracking",
                        columnList = "tracking_id"
                ),
                @Index(
                        name = "idx_paypal_partner_store",
                        columnList = "store_id"
                )
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_paypal_partner_tracking",
                        columnNames = "tracking_id"
                )
        }
)
public class PayPalPartnerOnboardingState {

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
            name = "tracking_id",
            nullable = false,
            unique = true,
            length = 127
    )
    private String trackingId;

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
                || LocalDateTime.now()
                        .isAfter(
                                expiresAt
                        );
    }

    public boolean isValid() {
        return !used
                && !isExpired();
    }

    public void markAsUsed() {
        used = true;
        usedAt =
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

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(
            String trackingId
    ) {
        this.trackingId =
                trackingId;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(
            LocalDateTime expiresAt
    ) {
        this.expiresAt =
                expiresAt;
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
