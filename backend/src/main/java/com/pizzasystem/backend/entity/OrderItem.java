package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @ManyToOne
    @JoinColumn(
            name = "order_id",
            nullable = false
    )
    private Order order;

    @ManyToOne
    @JoinColumn(
            name = "product_id",
            nullable = false
    )
    private Product product;

    @Column(
            nullable = false
    )
    private Integer quantity;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal unitPrice;

    // =========================
    // ADICIONAIS ESCOLHIDOS
    // =========================

    @OneToMany(
            mappedBy = "orderItem",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("sortOrder ASC, id ASC")
    private List<OrderItemAddon> addons =
            new ArrayList<>();

    // =========================
    // BORDA LEGADA
    // =========================

    /*
     * Mantido temporariamente para
     * preservar pedidos antigos e
     * não quebrar o fluxo atual.
     *
     * Depois da migração completa,
     * bordas passam a ser apenas
     * grupos de adicionais.
     */
    @Column(
            length = 80
    )
    private String crustName;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal crustPrice;

    // =========================
    // OBSERVAÇÃO
    // =========================

    @Column(
            length = 500
    )
    private String observation;

    public OrderItem() {
    }

    public Long getId() {
        return id;
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

    public Product getProduct() {
        return product;
    }

    public void setProduct(
            Product product
    ) {
        this.product =
                product;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity
    ) {
        this.quantity =
                quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(
            BigDecimal unitPrice
    ) {
        this.unitPrice =
                unitPrice;
    }

    public List<OrderItemAddon> getAddons() {
        return addons;
    }

    public void setAddons(
            List<OrderItemAddon> addons
    ) {
        this.addons =
                addons != null
                        ? addons
                        : new ArrayList<>();
    }

    public void addAddon(
            OrderItemAddon addon
    ) {

        if (addon == null) {
            return;
        }

        addon.setOrderItem(
                this
        );

        addons.add(
                addon
        );
    }

    public String getCrustName() {
        return crustName;
    }

    public void setCrustName(
            String crustName
    ) {
        this.crustName =
                crustName;
    }

    public BigDecimal getCrustPrice() {
        return crustPrice;
    }

    public void setCrustPrice(
            BigDecimal crustPrice
    ) {
        this.crustPrice =
                crustPrice;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(
            String observation
    ) {
        this.observation =
                observation;
    }
}