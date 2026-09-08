package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "coupons",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_coupon_store_code",
                        columnNames = {
                                "store_id",
                                "code"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_coupons_store_id",
                        columnList = "store_id"
                )
        }
)
public class Coupon {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // LOJA / TENANT
    // =========================

    /*
     * Temporariamente nullable para
     * conseguirmos migrar os cupons
     * antigos para a Store existente.
     */
    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    // =========================
    // CÓDIGO
    // =========================

    /*
     * O código não é mais único
     * globalmente.
     *
     * Duas lojas diferentes podem ter:
     *
     * PROMO10
     *
     * A combinação store_id + code
     * é que precisa ser única.
     */
    @Column(
            nullable = false,
            length = 50
    )
    private String code;

    // =========================
    // DESCONTO
    // =========================

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

    // =========================
    // STATUS
    // =========================

    @Column(nullable = false)
    private boolean active =
            true;

    // =========================
    // VALIDADE
    // =========================

    private LocalDateTime validFrom;

    private LocalDateTime validUntil;

    // =========================
    // LIMITE DE USO
    // =========================

    private Integer usageLimit;

    @Column(nullable = false)
    private Integer usageCount =
            0;

    // =========================
    // DATAS
    // =========================

    @Column(
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public Coupon() {
    }

    // =========================
    // CICLO DE VIDA
    // =========================

    @PrePersist
    public void prePersist() {

        LocalDateTime now =
                LocalDateTime.now();

        if (createdAt == null) {
            createdAt =
                    now;
        }

        updatedAt =
                now;

        if (usageCount == null) {
            usageCount =
                    0;
        }
    }

    @PreUpdate
    public void preUpdate() {

        updatedAt =
                LocalDateTime.now();
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public void setId(
            Long id
    ) {
        this.id =
                id;
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

    public String getCode() {
        return code;
    }

    public void setCode(
            String code
    ) {
        this.code =
                code;
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
        this.active =
                active;
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