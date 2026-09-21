package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.EmailVerificationCode;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationCodeRepository
        extends JpaRepository<EmailVerificationCode, Long> {

    // =========================
    // BUSCAR CÓDIGO
    // =========================

    Optional<EmailVerificationCode>
    findFirstByCustomerAndCodeAndUsedFalseOrderByCreatedAtDesc(
            Customer customer,
            String code
    );

    // =========================
    // CÓDIGOS ATIVOS DO CLIENTE
    // =========================

    List<EmailVerificationCode>
    findAllByCustomerAndUsedFalse(
            Customer customer
    );

    // =========================
    // ÚLTIMO CÓDIGO
    // =========================

    Optional<EmailVerificationCode>
    findFirstByCustomerOrderByCreatedAtDesc(
            Customer customer
    );
}