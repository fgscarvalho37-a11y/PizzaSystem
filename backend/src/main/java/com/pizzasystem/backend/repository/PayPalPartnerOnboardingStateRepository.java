package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.PayPalPartnerOnboardingState;
import com.pizzasystem.backend.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayPalPartnerOnboardingStateRepository
        extends JpaRepository<PayPalPartnerOnboardingState, Long> {

    Optional<PayPalPartnerOnboardingState>
    findByTrackingIdAndUsedFalse(
            String trackingId
    );

    List<PayPalPartnerOnboardingState>
    findAllByStoreAndUsedFalse(
            Store store
    );
}
