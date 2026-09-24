package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "cash_closings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cash_closing_store_date",
                        columnNames = {
                                "store_id",
                                "closing_date"
                        }
                )
        }
)
public class CashClosing {

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
            name = "closing_date",
            nullable = false
    )
    private LocalDate date;

    @Column(
            name = "closed_at",
            nullable = false
    )
    private LocalDateTime closedAt;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal totalRevenue;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal productRevenue;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal deliveryFees;

    @Column(
            nullable = false
    )
    private Long orderCount;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal averageTicket;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal pixRevenue;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal creditCardRevenue;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal debitCardRevenue;

    @Column(
            nullable = false
    )
    private Long deliveredOrders;

    @Column(
            nullable = false
    )
    private Long activeOrders;

    @Column(
            nullable = false
    )
    private Long cancelledOrders;

    // =========================
    // GETTERS E SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(
            Long id
    ) {
        this.id = id;
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

    public LocalDate getDate() {
        return date;
    }

    public void setDate(
            LocalDate date
    ) {
        this.date = date;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(
            LocalDateTime closedAt
    ) {
        this.closedAt = closedAt;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(
            BigDecimal totalRevenue
    ) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getProductRevenue() {
        return productRevenue;
    }

    public void setProductRevenue(
            BigDecimal productRevenue
    ) {
        this.productRevenue = productRevenue;
    }

    public BigDecimal getDeliveryFees() {
        return deliveryFees;
    }

    public void setDeliveryFees(
            BigDecimal deliveryFees
    ) {
        this.deliveryFees = deliveryFees;
    }

    public Long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(
            Long orderCount
    ) {
        this.orderCount = orderCount;
    }

    public BigDecimal getAverageTicket() {
        return averageTicket;
    }

    public void setAverageTicket(
            BigDecimal averageTicket
    ) {
        this.averageTicket = averageTicket;
    }

    public BigDecimal getPixRevenue() {
        return pixRevenue;
    }

    public void setPixRevenue(
            BigDecimal pixRevenue
    ) {
        this.pixRevenue = pixRevenue;
    }

    public BigDecimal getCreditCardRevenue() {
        return creditCardRevenue;
    }

    public void setCreditCardRevenue(
            BigDecimal creditCardRevenue
    ) {
        this.creditCardRevenue =
                creditCardRevenue;
    }

    public BigDecimal getDebitCardRevenue() {
        return debitCardRevenue;
    }

    public void setDebitCardRevenue(
            BigDecimal debitCardRevenue
    ) {
        this.debitCardRevenue =
                debitCardRevenue;
    }

    public Long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(
            Long deliveredOrders
    ) {
        this.deliveredOrders =
                deliveredOrders;
    }

    public Long getActiveOrders() {
        return activeOrders;
    }

    public void setActiveOrders(
            Long activeOrders
    ) {
        this.activeOrders =
                activeOrders;
    }

    public Long getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(
            Long cancelledOrders
    ) {
        this.cancelledOrders =
                cancelledOrders;
    }
}