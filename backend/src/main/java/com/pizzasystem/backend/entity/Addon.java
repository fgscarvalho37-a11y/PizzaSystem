package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "addons",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_addons_group_name",
                        columnNames = {
                                "addon_group_id",
                                "name"
                        }
                )
        }
)
public class Addon {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            length = 100
    )
    private String name;

    @Column(
            length = 255
    )
    private String description;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal price = BigDecimal.ZERO;

    @Column(
            nullable = false
    )
    private boolean active = true;

    @Column(
            nullable = false
    )
    private int sortOrder = 0;

    // =========================
    // GRUPO
    // =========================

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "addon_group_id",
            nullable = false
    )
    private AddonGroup group;

    // =========================
    // LOJA / TENANT
    // =========================

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

    public Addon() {
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
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(
            String description
    ) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(
            BigDecimal price
    ) {
        this.price = price;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(
            boolean active
    ) {
        this.active = active;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(
            int sortOrder
    ) {
        this.sortOrder = sortOrder;
    }

    public AddonGroup getGroup() {
        return group;
    }

    public void setGroup(
            AddonGroup group
    ) {
        this.group = group;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(
            Store store
    ) {
        this.store = store;
    }
}