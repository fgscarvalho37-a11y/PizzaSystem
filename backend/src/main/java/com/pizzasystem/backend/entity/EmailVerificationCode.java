package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "email_verification_codes",
        indexes = {
                @Index(
                        name = "idx_email_verification_customer",
                        columnList = "customer_id"
                ),
                @Index(
                        name = "idx_email_verification_code",
                        columnList = "code"
                )
        }
)
public class EmailVerificationCode {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // CLIENTE
    // =========================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "customer_id",
            nullable = false
    )
    private Customer customer;

    // =========================
    // CÓDIGO
    // =========================

    /*
     * Código de 6 dígitos enviado
     * para o e-mail do cliente.
     */
    @Column(
            nullable = false,
            length = 6
    )
    private String code;

    // =========================
    // EXPIRAÇÃO
    // =========================

    /*
     * Data e hora limite para
     * utilização do código.
     */
    @Column(
            name = "expires_at",
            nullable = false
    )
    private LocalDateTime expiresAt;

    // =========================
    // UTILIZAÇÃO
    // =========================

    /*
     * Indica se o código já foi
     * utilizado com sucesso.
     */
    @Column(
            nullable = false
    )
    private boolean used = false;

    /*
     * Data em que o código
     * foi utilizado.
     */
    @Column(
            name = "used_at"
    )
    private LocalDateTime usedAt;

    // =========================
    // CRIAÇÃO
    // =========================

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    public EmailVerificationCode() {
    }

    // =========================
    // VALIDAÇÃO
    // =========================

    public boolean isExpired() {
        return expiresAt == null
                || LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used && !isExpired();
    }

    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(
            Customer customer
    ) {
        this.customer =
                customer;
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

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(
            LocalDateTime expiresAt
    ) {
        this.expiresAt =
                expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(
            boolean used
    ) {
        this.used =
                used;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(
            LocalDateTime usedAt
    ) {
        this.usedAt =
                usedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}