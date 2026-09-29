package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.entity.StripeConnectOAuthState;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StripeConnectOAuthStateRepository
        extends JpaRepository<StripeConnectOAuthState, Long> {

    Optional<StripeConnectOAuthState> findByStateAndUsedFalse(
            String state
    );

    List<StripeConnectOAuthState> findAllByStoreAndUsedFalse(
            Store store
    );
}
