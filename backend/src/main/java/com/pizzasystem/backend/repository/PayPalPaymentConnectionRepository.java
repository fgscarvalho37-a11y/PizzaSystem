package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.PayPalPaymentConnection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PayPalPaymentConnectionRepository
        extends JpaRepository<PayPalPaymentConnection, Long> {

    Optional<PayPalPaymentConnection> findByStoreId(Long storeId);

    Optional<PayPalPaymentConnection>
    findByStoreIdAndConnectedTrue(Long storeId);
}
