package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.MercadoPagoOAuthState;
import com.pizzasystem.backend.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MercadoPagoOAuthStateRepository
        extends JpaRepository<MercadoPagoOAuthState, Long> {

    Optional<MercadoPagoOAuthState> findByStateAndUsedFalse(
            String state
    );

    List<MercadoPagoOAuthState> findAllByStoreAndUsedFalse(
            Store store
    );
}