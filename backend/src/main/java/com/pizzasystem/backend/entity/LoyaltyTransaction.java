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
     * Opcional.
     *
     * Transações geradas por pedidos
     * possuem um pedido associado.
     *
     * Outras movimentações, como
     * resgates de recompensa, não
     * precisam estar vinculadas
     * diretamente a um pedido.
     *
     * Quando existir um pedido,
     * ele continua sendo UNIQUE para
     * impedir que o mesmo pedido gere
     * pontos mais de uma vez.
     */
    @OneToOne(
            fetch = FetchType.LAZY,
            optional = true
    )
    @JoinColumn(
            name = "order_id",
            nullable = true,
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
     * Negativo:
     * resgate/estorno.
     */
    @Column(nullable = false)
    private Integer points;

    // =========================
    // TIPO
    // =========================

    /*
     * Exemplos:
     *
     * ORDER_REWARD
     * REWARD_REDEMPTION
     */
    @Column(
            nullable = false,
            length = 40
    )
    private String type =
            "ORDER_REWARD";

    // =========================
    // DESCRIÇÃO
    // =========================

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