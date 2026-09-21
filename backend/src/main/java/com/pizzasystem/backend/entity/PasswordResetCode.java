package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "password_reset_codes",
        indexes = {
                @Index(
                        name = "idx_password_reset_customer",
                        columnList = "customer_id"
                ),
                @Index(
                        name = "idx_password_reset_code",
                        columnList = "code"
                )
        }
)
public class PasswordResetCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "customer_id",
            nullable = false
    )
    private Customer customer;

    @Column(
            nullable = false,
            length = 6
    )
    private String code;

    @Column(
            name = "expires_at",
            nullable = false
    )
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt =
            LocalDateTime.now();

    public PasswordResetCode() {
    }

    public boolean isExpired() {
        return expiresAt == null ||
                LocalDateTime.now()
                        .isAfter(expiresAt);
    }

    public boolean isValid() {
        return !used && !isExpired();
    }

    public void markAsUsed() {
        this.used = true;
        this.usedAt =
                LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(
            Customer customer
    ) {
        this.customer = customer;
    }

    public String getCode() {
        return code;
    }

    public void setCode(
            String code
    ) {
        this.code = code;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(
            LocalDateTime expiresAt
    ) {
        this.expiresAt = expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void setUsed(
            boolean used
    ) {
        this.used = used;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(
            LocalDateTime usedAt
    ) {
        this.usedAt = usedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}