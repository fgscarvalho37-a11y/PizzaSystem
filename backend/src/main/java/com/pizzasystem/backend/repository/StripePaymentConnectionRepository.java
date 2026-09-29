package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.StripePaymentConnection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StripePaymentConnectionRepository
        extends JpaRepository<StripePaymentConnection, Long> {

    Optional<StripePaymentConnection>
    findByStoreId(
            Long storeId
    );

    Optional<StripePaymentConnection>
    findByStoreIdAndConnectedTrue(
            Long storeId
    );

    boolean existsByStoreIdAndConnectedTrue(
            Long storeId
    );
}
