package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.LoyaltyRedemption;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyRedemptionRepository
        extends JpaRepository<LoyaltyRedemption, Long> {

    // =========================
    // RESGATES DO CLIENTE
    // =========================

    List<LoyaltyRedemption>
    findByCustomerIdOrderByCreatedAtDesc(
            Long customerId
    );

    // =========================
    // RESGATES DO CLIENTE
    // EM UMA LOJA
    // =========================

    List<LoyaltyRedemption>
    findByCustomerIdAndStoreIdOrderByCreatedAtDesc(
            Long customerId,
            Long storeId
    );

    // =========================
    // RESGATES DA LOJA
    // =========================

    List<LoyaltyRedemption>
    findByStoreIdOrderByCreatedAtDesc(
            Long storeId
    );

    // =========================
    // RESGATES DA LOJA
    // POR STATUS
    // =========================

    List<LoyaltyRedemption>
    findByStoreIdAndStatusOrderByCreatedAtDesc(
            Long storeId,
            String status
    );

    // =========================
    // CONTADOR POR STATUS
    // =========================

    long countByStoreIdAndStatus(
            Long storeId,
            String status
    );
}