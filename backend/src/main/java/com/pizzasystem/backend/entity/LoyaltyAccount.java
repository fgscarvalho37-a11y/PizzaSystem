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
    // SALDO
    // =========================

    /*
     * Chamamos internamente de points
     * mesmo quando a interface mostrar
     * "selos".
     *
     * Isso deixa o sistema flexível.
     */
    @Column(nullable = false)
    private Integer points =
            0;

    /*
     * Total acumulado durante toda
     * a vida da conta.
     *
     * Mesmo que futuramente o cliente
     * troque pontos por recompensa,
     * esse valor não diminui.
     */
    @Column(nullable = false)
    private Integer lifetimePoints =
            0;

    // =========================
    // RECOMPENSAS
    // =========================

    /*
     * Quantas recompensas o cliente
     * já resgatou nessa loja.
     */
    @Column(nullable = false)
    private Integer rewardsRedeemed =
            0;

    // =========================
    // DATAS
    // =========================

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    private LocalDateTime updatedAt;

    public LoyaltyAccount() {
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

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(
            Customer customer
    ) {
        this.customer =
                customer;
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

    public Integer getPoints() {
        return points;
    }

    public void setPoints(
            Integer points
    ) {
        this.points =
                points;
    }

    public Integer getLifetimePoints() {
        return lifetimePoints;
    }

    public void setLifetimePoints(
            Integer lifetimePoints
    ) {
        this.lifetimePoints =
                lifetimePoints;
    }

    public Integer getRewardsRedeemed() {
        return rewardsRedeemed;
    }

    public void setRewardsRedeemed(
            Integer rewardsRedeemed
    ) {
        this.rewardsRedeemed =
                rewardsRedeemed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}