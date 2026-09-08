package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "delivery_areas",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_delivery_area_store_neighborhood",
                        columnNames = {
                                "store_id",
                                "neighborhood"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_delivery_areas_store_id",
                        columnList = "store_id"
                )
        }
)
public class DeliveryArea {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // LOJA / TENANT
    // =========================

    /*
     * Temporariamente nullable para permitir
     * que as áreas antigas sejam migradas
     * para a Store 1.
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
    // BAIRRO
    // =========================

    /*
     * Não é mais unique globalmente.
     *
     * A combinação:
     *
     * store_id + neighborhood
     *
     * é que precisa ser única.
     */
    @Column(
            nullable = false,
            length = 120
    )
    private String neighborhood;

    // =========================
    // TAXA
    // =========================

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal fee;

    // =========================
    // STATUS
    // =========================

    @Column(nullable = false)
    private boolean active =
            true;

    public DeliveryArea() {
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

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

    public String getNeighborhood() {
        return neighborhood;
    }

    public void setNeighborhood(
            String neighborhood
    ) {
        this.neighborhood =
                neighborhood;
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