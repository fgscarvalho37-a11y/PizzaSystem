package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "loyalty_redemptions",
        indexes = {
                @Index(
                        name = "idx_loyalty_redemption_customer",
                        columnList = "customer_id"
                ),
                @Index(
                        name = "idx_loyalty_redemption_store",
                        columnList = "store_id"
                ),
                @Index(
                        name = "idx_loyalty_redemption_account",
                        columnList = "loyalty_account_id"
                ),
                @Index(
                        name = "idx_loyalty_redemption_status",
                        columnList = "status"
                )
        }
)
public class LoyaltyRedemption {

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
    // CONTA DE FIDELIDADE
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "loyalty_account_id",
            nullable = false
    )
    private LoyaltyAccount loyaltyAccount;

    // =========================
    // PONTOS UTILIZADOS
    // =========================

    @Column(
            name = "points_used",
            nullable = false
    )
    private Integer pointsUsed;

    // =========================
    // RECOMPENSA
    // =========================

    /*
     * Guardamos uma cópia da descrição.
     *
     * Assim, se o administrador alterar
     * a recompensa futuramente, resgates
     * antigos continuam mostrando aquilo
     * que o cliente realmente resgatou.
     */
    @Column(
            name = "reward_description",
            nullable = false,
            length = 250
    )
    private String rewardDescription;

    // =========================
    // STATUS
    // =========================

    /*
     * PENDING:
     * cliente resgatou, mas ainda não utilizou.
     *
     * USED:
     * loja já entregou/aplicou a recompensa.
     *
     * CANCELLED:
     * reservado para cancelamento futuro.
     */
    @Column(
            nullable = false,
            length = 30
    )
    private String status =
            "PENDING";

    // =========================
    // DATAS
    // =========================

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    @Column(
            name = "used_at"
    )
    private LocalDateTime usedAt;

    @Column(
            name = "cancelled_at"
    )
    private LocalDateTime cancelledAt;

    public LoyaltyRedemption() {
    }

    // =========================
    // PRE PERSIST
    // =========================

    @PrePersist
    private void onCreate() {

        if (createdAt == null) {
            createdAt =
                    LocalDateTime.now();
        }

        if (status == null
                || status.isBlank()) {

            status =
                    "PENDING";
        }
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

    public LoyaltyAccount getLoyaltyAccount() {
        return loyaltyAccount;
    }

    public void setLoyaltyAccount(
            LoyaltyAccount loyaltyAccount
    ) {
        this.loyaltyAccount =
                loyaltyAccount;
    }

    public Integer getPointsUsed() {
        return pointsUsed;
    }

    public void setPointsUsed(
            Integer pointsUsed
    ) {
        this.pointsUsed =
                pointsUsed;
    }

    public String getRewardDescription() {
        return rewardDescription;
    }

    public void setRewardDescription(
            String rewardDescription
    ) {
        this.rewardDescription =
                rewardDescription;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(
            String status
    ) {
        this.status =
                status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(
            LocalDateTime usedAt
    ) {
        this.usedAt =
                usedAt;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(
            LocalDateTime cancelledAt
    ) {
        this.cancelledAt =
                cancelledAt;
    }
}