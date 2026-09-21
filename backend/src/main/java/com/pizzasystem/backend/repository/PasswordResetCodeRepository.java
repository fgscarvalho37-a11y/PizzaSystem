package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.PasswordResetCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetCodeRepository
        extends JpaRepository<PasswordResetCode, Long> {

    Optional<PasswordResetCode>
    findFirstByCustomerAndCodeAndUsedFalseOrderByCreatedAtDesc(
            Customer customer,
            String code
    );

    List<PasswordResetCode>
    findAllByCustomerAndUsedFalse(
            Customer customer
    );

    Optional<PasswordResetCode>
    findFirstByCustomerOrderByCreatedAtDesc(
            Customer customer
    );
}