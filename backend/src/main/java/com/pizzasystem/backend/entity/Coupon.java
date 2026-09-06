package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "coupons",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_coupon_code",
                        columnNames = "code"
                )
        }
)
public class Coupon {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            unique = true,
            length = 50
    )
    private String code;

    @Enumerated(
            EnumType.STRING
    )
    @Column(
            nullable = false,
            length = 20
    )
    private CouponDiscountType discountType;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal discountValue;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal minimumOrderValue;

    @Column(
            precision = 12,
            scale = 2
    )
    private BigDecimal maximumDiscountValue;

    @Column(
            nullable = false
    )
    private boolean active = true;

    @Column
    private LocalDateTime validFrom;

    @Column
    private LocalDateTime validUntil;

    @Column
    private Integer usageLimit;

    @Column(
            nullable = false
    )
    private Integer usageCount = 0;

    @Column(
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
            nullable = false
    )
    private LocalDateTime updatedAt;

    // =========================
    // CICLO DE VIDA
    // =========================

    @PrePersist
    public void prePersist() {

        LocalDateTime now =
                LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (usageCount == null) {
            usageCount = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {

        updatedAt =
                LocalDateTime.now();
    }

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

    public String getCode() {
        return code;
    }

    public void setCode(
            String code
    ) {
        this.code = code;
    }

    public CouponDiscountType getDiscountType() {
        return discountType;
    }

    public void setDiscountType(
            CouponDiscountType discountType
    ) {
        this.discountType =
                discountType;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(
            BigDecimal discountValue
    ) {
        this.discountValue =
                discountValue;
    }

    public BigDecimal getMinimumOrderValue() {
        return minimumOrderValue;
    }

    public void setMinimumOrderValue(
            BigDecimal minimumOrderValue
    ) {
        this.minimumOrderValue =
                minimumOrderValue;
    }

    public BigDecimal getMaximumDiscountValue() {
        return maximumDiscountValue;
    }

    public void setMaximumDiscountValue(
            BigDecimal maximumDiscountValue
    ) {
        this.maximumDiscountValue =
                maximumDiscountValue;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(
            boolean active
    ) {
        this.active = active;
    }

    public LocalDateTime getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(
            LocalDateTime validFrom
    ) {
        this.validFrom =
                validFrom;
    }

    public LocalDateTime getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(
            LocalDateTime validUntil
    ) {
        this.validUntil =
                validUntil;
    }

    public Integer getUsageLimit() {
        return usageLimit;
    }

    public void setUsageLimit(
            Integer usageLimit
    ) {
        this.usageLimit =
                usageLimit;
    }

    public Integer getUsageCount() {
        return usageCount;
    }

    public void setUsageCount(
            Integer usageCount
    ) {
        this.usageCount =
                usageCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt
    ) {
        this.createdAt =
                createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(
            LocalDateTime updatedAt
    ) {
        this.updatedAt =
                updatedAt;
    }
}