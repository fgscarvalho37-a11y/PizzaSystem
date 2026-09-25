package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "delivery_areas",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_delivery_area_store_city_neighborhood",
                        columnNames = {
                                "store_id",
                                "city",
                                "neighborhood"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_delivery_areas_store_id",
                        columnList = "store_id"
                ),
                @Index(
                        name = "idx_delivery_areas_store_city",
                        columnList = "store_id, city"
                )
        }
)
public class DeliveryArea {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    @Column(
            length = 120
    )
    private String city;

    @Column(
            nullable = false,
            length = 120
    )
    private String neighborhood;

    /*
     * FIXED:
     * fee é o valor definido diretamente.
     *
     * PER_KM:
     * fee é calculado e persistido como
     * distanceKm x feePerKm.
     */
    @Column(
            name = "pricing_mode",
            nullable = false,
            length = 20
    )
    private String pricingMode =
            "FIXED";

    @Column(
            name = "distance_km",
            precision = 8,
            scale = 2
    )
    private BigDecimal distanceKm;

    @Column(
            name = "fee_per_km",
            precision = 12,
            scale = 2
    )
    private BigDecimal feePerKm;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal fee;

    @Column(nullable = false)
    private boolean active =
            true;

    public DeliveryArea() {
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

    public String getCity() {
        return city;
    }

    public void setCity(
            String city
    ) {
        this.city =
                city;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public void setNeighborhood(
            String neighborhood
    ) {
        this.neighborhood =
                neighborhood;
    }

    public String getPricingMode() {
        return pricingMode;
    }

    public void setPricingMode(
            String pricingMode
    ) {
        this.pricingMode =
                pricingMode;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(
            BigDecimal distanceKm
    ) {
        this.distanceKm =
                distanceKm;
    }

    public BigDecimal getFeePerKm() {
        return feePerKm;
    }

    public void setFeePerKm(
            BigDecimal feePerKm
    ) {
        this.feePerKm =
                feePerKm;
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
