package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "delivery_distance_tiers",
        indexes = {
                @Index(
                        name = "idx_delivery_distance_tiers_store_id",
                        columnList = "store_id"
                ),
                @Index(
                        name = "idx_delivery_distance_tiers_store_active",
                        columnList = "store_id, active"
                )
        }
)
public class DeliveryDistanceTier {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @JsonIgnore
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
            name = "min_distance_km",
            nullable = false,
            precision = 8,
            scale = 2
    )
    private BigDecimal minDistanceKm;

    @Column(
            name = "max_distance_km",
            nullable = false,
            precision = 8,
            scale = 2
    )
    private BigDecimal maxDistanceKm;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal fee;

    @Column(nullable = false)
    private boolean active =
            true;

    public DeliveryDistanceTier() {
    }

    public Long getId() {
        return id;
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

    public BigDecimal getMinDistanceKm() {
        return minDistanceKm;
    }

    public void setMinDistanceKm(
            BigDecimal minDistanceKm
    ) {
        this.minDistanceKm =
                minDistanceKm;
    }

    public BigDecimal getMaxDistanceKm() {
        return maxDistanceKm;
    }

    public void setMaxDistanceKm(
            BigDecimal maxDistanceKm
    ) {
        this.maxDistanceKm =
                maxDistanceKm;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(
            BigDecimal fee
    ) {
        this.fee =
                fee;
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
}
