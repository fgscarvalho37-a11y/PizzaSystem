package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "customers",
        indexes = {
                @Index(
                        name = "idx_customer_email",
                        columnList = "email"
                ),
                @Index(
                        name = "idx_customer_google_id",
                        columnList = "google_id"
                )
        }
)
public class Customer {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // IDENTIFICAÇÃO
    // =========================

    @Column(
            nullable = false,
            length = 120
    )
    private String name;

    @Column(
            nullable = false,
            unique = true,
            length = 180
    )
    private String email;

    @Column(
            length = 30
    )
    private String phone;

    // =========================
    // LOGIN COM SENHA
    // =========================

    /*
     * Pode ser null.
     *
     * Cliente criado somente pelo
     * Google não precisa ter senha.
     */
    @Column(
            name = "password_hash",
            length = 255
    )
    private String passwordHash;

    // =========================
    // LOGIN COM GOOGLE
    // =========================

    /*
     * ID único retornado pelo Google.
     *
     * Pode ser null para clientes
     * cadastrados com e-mail e senha.
     */
    @Column(
            name = "google_id",
            unique = true,
            length = 180
    )
    private String googleId;

    /*
     * URL da foto da conta Google.
     *
     * Futuramente pode aparecer
     * no perfil do cliente.
     */
    @Column(
            name = "profile_image_url",
            length = 500
    )
    private String profileImageUrl;

    // =========================
    // E-MAIL
    // =========================

    /*
     * Futuramente podemos exigir
     * verificação de e-mail para
     * algumas operações.
     */
    @Column(
            nullable = false
    )
    private boolean emailVerified =
            false;

    // =========================
    // CONTA
    // =========================

    @Column(
            nullable = false
    )
    private boolean active =
            true;

    // =========================
    // DATAS
    // =========================

    @Column(
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    public Customer() {
    }

    @PreUpdate
    private void updateTimestamp() {

        updatedAt =
                LocalDateTime.now();
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

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

    public String getEmail() {
        return email;
    }

    public void setEmail(
            String email
    ) {
        this.email =
                email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(
            String phone
    ) {
        this.phone =
                phone;
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

    public String getGoogleId() {
        return googleId;
    }

    public void setGoogleId(
            String googleId
    ) {
        this.googleId =
                googleId;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(
            String profileImageUrl
    ) {
        this.profileImageUrl =
                profileImageUrl;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(
            boolean emailVerified
    ) {
        this.emailVerified =
                emailVerified;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(
            LocalDateTime lastLoginAt
    ) {
        this.lastLoginAt =
                lastLoginAt;
    }
}