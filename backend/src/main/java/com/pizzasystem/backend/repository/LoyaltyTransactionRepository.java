package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.LoyaltyTransaction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyTransactionRepository
        extends JpaRepository<LoyaltyTransaction, Long> {

    boolean existsByOrderId(
            Long orderId
    );

    List<LoyaltyTransaction>
    findByLoyaltyAccountIdOrderByCreatedAtDesc(
            Long loyaltyAccountId
    );
}