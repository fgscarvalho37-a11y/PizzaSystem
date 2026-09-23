package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "order_item_addons",
        indexes = {
                @Index(
                        name = "idx_order_item_addons_order_item",
                        columnList = "order_item_id"
                )
        }
)
public class OrderItemAddon {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // ITEM DO PEDIDO
    // =========================

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "order_item_id",
            nullable = false
    )
    private OrderItem orderItem;

    // =========================
    // REFERÊNCIA ORIGINAL
    // =========================

    /*
     * ID do adicional no momento
     * em que o pedido foi criado.
     *
     * Não usamos FK aqui porque
     * queremos preservar o histórico
     * mesmo que o adicional seja
     * alterado futuramente.
     */
    @Column(
            name = "source_addon_id"
    )
    private Long sourceAddonId;

    // =========================
    // SNAPSHOT DO GRUPO
    // =========================

    @Column(
            name = "group_name",
            nullable = false,
            length = 100
    )
    private String groupName;

    // =========================
    // SNAPSHOT DO ADICIONAL
    // =========================

    @Column(
            name = "addon_name",
            nullable = false,
            length = 100
    )
    private String addonName;

    @Column(
            name = "addon_price",
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal addonPrice =
            BigDecimal.ZERO;

    @Column(
            nullable = false
    )
    private int sortOrder = 0;

    public OrderItemAddon() {
    }

    public Long getId() {
        return id;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(
            OrderItem orderItem
    ) {
        this.orderItem =
                orderItem;
    }

    public Long getSourceAddonId() {
        return sourceAddonId;
    }

    public void setSourceAddonId(
            Long sourceAddonId
    ) {
        this.sourceAddonId =
                sourceAddonId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(
            String groupName
    ) {
        this.groupName =
                groupName;
    }

    public String getAddonName() {
        return addonName;
    }

    public void setAddonName(
            String addonName
    ) {
        this.addonName =
                addonName;
    }

    public BigDecimal getAddonPrice() {
        return addonPrice;
    }

    public void setAddonPrice(
            BigDecimal addonPrice
    ) {
        this.addonPrice =
                addonPrice;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(
            int sortOrder
    ) {
        this.sortOrder =
                sortOrder;
    }
}