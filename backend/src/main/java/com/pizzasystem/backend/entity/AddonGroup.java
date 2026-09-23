package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "addon_groups",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_addon_groups_store_name",
                        columnNames = {
                                "store_id",
                                "name"
                        }
                )
        }
)
public class AddonGroup {

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
            nullable = false
    )
    private boolean required = false;

    @Column(
            nullable = false
    )
    private int minSelections = 0;

    @Column(
            nullable = false
    )
    private int maxSelections = 1;

    @Column(
            nullable = false
    )
    private boolean active = true;

    @Column(
            nullable = false
    )
    private int sortOrder = 0;

    // =========================
    // OPÇÕES / ADICIONAIS
    // =========================

    @OneToMany(
            mappedBy = "group",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("sortOrder ASC, id ASC")
    private List<Addon> addons =
            new ArrayList<>();

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

    public AddonGroup() {
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

    public boolean isRequired() {
        return required;
    }

    public void setRequired(
            boolean required
    ) {
        this.required = required;
    }

    public int getMinSelections() {
        return minSelections;
    }

    public void setMinSelections(
            int minSelections
    ) {
        this.minSelections = minSelections;
    }

    public int getMaxSelections() {
        return maxSelections;
    }

    public void setMaxSelections(
            int maxSelections
    ) {
        this.maxSelections = maxSelections;
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

    public List<Addon> getAddons() {
        return addons;
    }

    public void setAddons(
            List<Addon> addons
    ) {
        this.addons =
                addons != null
                        ? addons
                        : new ArrayList<>();
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