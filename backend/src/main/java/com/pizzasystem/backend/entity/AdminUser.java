package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "admin_users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_admin_users_email",
                        columnNames = "email"
                )
        }
)
public class AdminUser {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            unique = true,
            length = 150
    )
    private String email;

    @JsonIgnore
    @Column(
            nullable = false,
            length = 255
    )
    private String passwordHash;

    @Column(
            nullable = false
    )
    private boolean active = true;

    @Column(
            name = "onboarding_completed",
            nullable = false
    )
    private boolean onboardingCompleted = false;

    // =========================
    // LOJA / TENANT
    // =========================

    /*
     * Temporariamente nullable.
     *
     * O administrador atual já existe
     * no banco sem store_id.
     *
     * Depois da migração, todo admin
     * deverá pertencer a uma Store.
     */
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    @Column(
            nullable = false
    )
    private LocalDateTime createdAt;

    @Column(
            nullable = false
    )
    private LocalDateTime updatedAt;

    public AdminUser() {
    }

    // =========================
    // JPA
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

    public String getEmail() {
        return email;
    }

    public void setEmail(
            String email
    ) {
        this.email =
                email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(
            String passwordHash
    ) {
        this.passwordHash =
                passwordHash;
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

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(
            boolean onboardingCompleted
    ) {
        this.onboardingCompleted =
                onboardingCompleted;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}