package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "crusts",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_crusts_store_name",
                        columnNames = {
                                "store_id",
                                "name"
                        }
                )
        }
)
public class Crust {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            length = 80
    )
    private String name;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal price;

    @Column(
            nullable = false
    )
    private boolean active = true;

    @Column(
            nullable = false
    )
    private int sortOrder = 0;

    // =========================
    // LOJA / TENANT
    // =========================

    /*
     * Temporariamente nullable.
     *
     * As bordas que já existem no banco
     * ainda não possuem store_id.
     *
     * Depois da migração, toda borda
     * pertencerá obrigatoriamente
     * a uma Store.
     */
    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    public Crust() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(
            String name
    ) {
        this.name =
                name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(
            BigDecimal price
    ) {
        this.price =
                price;
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

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(
            int sortOrder
    ) {
        this.sortOrder =
                sortOrder;
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
}