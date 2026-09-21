package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "loyalty_accounts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_loyalty_customer_store",
                        columnNames = {
                                "customer_id",
                                "store_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_loyalty_account_customer",
                        columnList = "customer_id"
                ),
                @Index(
                        name = "idx_loyalty_account_store",
                        columnList = "store_id"
                )
        }
)
public class LoyaltyAccount {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // CLIENTE
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "customer_id",
            nullable = false
    )
    private Customer customer;

    // =========================
    // LOJA
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "store_id",
            nullable = false
    )
    private Store store;

    // =========================
    // PONTOS
    // =========================

    @Column(nullable = false)
    private Integer points = 0;

    @Column(
            name = "lifetime_points",
            nullable = false
    )
    private Integer lifetimePoints = 0;

    @Column(
            name = "rewards_redeemed",
            nullable = false
    )
    private Integer rewardsRedeemed = 0;

    // =========================
    // DATAS
    // =========================

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public LoyaltyAccount() {
    }

    @PrePersist
    private void onCreate() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        updatedAt = LocalDateTime.now();

        if (points == null) {
            points = 0;
        }

        if (lifetimePoints == null) {
            lifetimePoints = 0;
        }

        if (rewardsRedeemed == null) {
            rewardsRedeemed = 0;
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(
            Customer customer
    ) {
        this.customer = customer;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(
            Store store
    ) {
        this.store = store;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(
            Integer points
    ) {
        this.points = points;
    }

    public Integer getLifetimePoints() {
        return lifetimePoints;
    }

    public void setLifetimePoints(
            Integer lifetimePoints
    ) {
        this.lifetimePoints = lifetimePoints;
    }

    public Integer getRewardsRedeemed() {
        return rewardsRedeemed;
    }

    public void setRewardsRedeemed(
            Integer rewardsRedeemed
    ) {
        this.rewardsRedeemed = rewardsRedeemed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}