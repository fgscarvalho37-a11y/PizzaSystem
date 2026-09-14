package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "customer_stores",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_customer_store",
                        columnNames = {
                                "customer_id",
                                "store_id"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_customer_store_customer",
                        columnList = "customer_id"
                ),
                @Index(
                        name = "idx_customer_store_store",
                        columnList = "store_id"
                )
        }
)
public class CustomerStore {

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
    // FIDELIDADE
    // =========================

    /*
     * Quantidade atual de selos
     * deste cliente nesta loja.
     */
    @Column(
            nullable = false
    )
    private Integer stamps =
            0;

    /*
     * Quantidade atual de pontos
     * deste cliente nesta loja.
     */
    @Column(
            nullable = false
    )
    private Integer points =
            0;

    /*
     * Total histórico de selos
     * já conquistados.
     */
    @Column(
            nullable = false
    )
    private Integer totalStampsEarned =
            0;

    /*
     * Total histórico de pontos
     * já conquistados.
     */
    @Column(
            nullable = false
    )
    private Integer totalPointsEarned =
            0;

    /*
     * Total de recompensas
     * resgatadas nesta loja.
     */
    @Column(
            nullable = false
    )
    private Integer rewardsRedeemed =
            0;

    // =========================
    // RELACIONAMENTO COM A LOJA
    // =========================

    /*
     * Data da primeira interação
     * do cliente com esta loja.
     */
    @Column(
            nullable = false
    )
    private LocalDateTime joinedAt =
            LocalDateTime.now();

    /*
     * Última compra aprovada
     * nesta loja.
     */
    private LocalDateTime lastOrderAt;

    // =========================
    // STATUS
    // =========================

    @Column(
            nullable = false
    )
    private boolean active =
            true;

    // =========================
    // DATAS
    // =========================

    @Column(
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    private LocalDateTime updatedAt;

    public CustomerStore() {
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

    public Integer getStamps() {
        return stamps;
    }

    public void setStamps(
            Integer stamps
    ) {
        this.stamps =
                stamps;
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

    public Integer getTotalStampsEarned() {
        return totalStampsEarned;
    }

    public void setTotalStampsEarned(
            Integer totalStampsEarned
    ) {
        this.totalStampsEarned =
                totalStampsEarned;
    }

    public Integer getTotalPointsEarned() {
        return totalPointsEarned;
    }

    public void setTotalPointsEarned(
            Integer totalPointsEarned
    ) {
        this.totalPointsEarned =
                totalPointsEarned;
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

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public LocalDateTime getLastOrderAt() {
        return lastOrderAt;
    }

    public void setLastOrderAt(
            LocalDateTime lastOrderAt
    ) {
        this.lastOrderAt =
                lastOrderAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(
            boolean active
    ) {
        this.active =
                active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}