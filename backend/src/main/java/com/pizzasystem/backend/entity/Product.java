package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false
    )
    private String name;

    @Column(
            length = 1000
    )
    private String description;

    private String imageUrl;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal price;

    @Column(
            nullable = false
    )
    private boolean available = true;

    // =========================
    // LEGADO - BORDAS
    // =========================

    /*
     * Mantido temporariamente para
     * não quebrar o sistema atual.
     *
     * Será removido depois que todo
     * o fluxo estiver usando grupos
     * de adicionais.
     */
    @Column(
            nullable = false
    )
    private boolean allowCrust = false;

    // =========================
    // CATEGORIA
    // =========================

    @ManyToOne
    @JoinColumn(
            name = "category_id",
            nullable = false
    )
    private Category category;

    // =========================
    // GRUPOS DE ADICIONAIS
    // =========================

    /*
     * Um produto pode possuir vários
     * grupos de adicionais.
     *
     * Exemplo:
     *
     * Açaí:
     * - Frutas
     * - Complementos
     *
     * Hambúrguer:
     * - Adicionais
     * - Molhos
     *
     * Pizza:
     * - Bordas
     * - Adicionais
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_addon_groups",
            joinColumns = {
                    @JoinColumn(
                            name = "product_id"
                    )
            },
            inverseJoinColumns = {
                    @JoinColumn(
                            name = "addon_group_id"
                    )
            },
            uniqueConstraints = {
                    @UniqueConstraint(
                            name = "uk_product_addon_group",
                            columnNames = {
                                    "product_id",
                                    "addon_group_id"
                            }
                    )
            }
    )
    @OrderBy("sortOrder ASC, id ASC")
    private Set<AddonGroup> addonGroups =
            new LinkedHashSet<>();

    // =========================
    // LOJA / TENANT
    // =========================

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    public Product() {
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

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(
            String imageUrl
    ) {
        this.imageUrl = imageUrl;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(
            BigDecimal price
    ) {
        this.price = price;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(
            boolean available
    ) {
        this.available = available;
    }

    public boolean isAllowCrust() {
        return allowCrust;
    }

    public void setAllowCrust(
            boolean allowCrust
    ) {
        this.allowCrust = allowCrust;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(
            Category category
    ) {
        this.category = category;
    }

    public Set<AddonGroup> getAddonGroups() {
        return addonGroups;
    }

    public void setAddonGroups(
            Set<AddonGroup> addonGroups
    ) {
        this.addonGroups =
                addonGroups != null
                        ? addonGroups
                        : new LinkedHashSet<>();
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