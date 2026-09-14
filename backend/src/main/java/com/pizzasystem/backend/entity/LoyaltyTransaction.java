package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "loyalty_transactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_loyalty_transaction_order",
                        columnNames = "order_id"
                )
        },
        indexes = {
                @Index(
                        name = "idx_loyalty_transaction_account",
                        columnList = "loyalty_account_id"
                ),
                @Index(
                        name = "idx_loyalty_transaction_order",
                        columnList = "order_id"
                )
        }
)
public class LoyaltyTransaction {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

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
    // PEDIDO
    // =========================

    /*
     * UNIQUE.
     *
     * Um pedido só pode gerar uma
     * transação de fidelidade.
     */
    @OneToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "order_id",
            nullable = false,
            unique = true
    )
    private Order order;

    // =========================
    // PONTOS
    // =========================

    /*
     * Positivo:
     * crédito.
     *
     * Negativo futuramente:
     * resgate/estorno.
     */
    @Column(nullable = false)
    private Integer points;

    @Column(
            nullable = false,
            length = 40
    )
    private String type =
            "ORDER_REWARD";

    @Column(
            length = 250
    )
    private String description;

    // =========================
    // DATA
    // =========================

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    public LoyaltyTransaction() {
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
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

    public Order getOrder() {
        return order;
    }

    public void setOrder(
            Order order
    ) {
        this.order =
                order;
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

    public String getType() {
        return type;
    }

    public void setType(
            String type
    ) {
        this.type =
                type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description
    ) {
        this.description =
                description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}