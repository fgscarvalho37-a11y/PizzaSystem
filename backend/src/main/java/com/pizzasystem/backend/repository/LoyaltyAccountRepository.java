package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.LoyaltyAccount;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LoyaltyAccountRepository
        extends JpaRepository<LoyaltyAccount, Long> {

    Optional<LoyaltyAccount>
    findByCustomerIdAndStoreId(
            Long customerId,
            Long storeId
    );

    List<LoyaltyAccount>
    findByCustomerIdOrderByUpdatedAtDesc(
            Long customerId
    );

    List<LoyaltyAccount>
    findByStoreIdOrderByPointsDesc(
            Long storeId
    );
}