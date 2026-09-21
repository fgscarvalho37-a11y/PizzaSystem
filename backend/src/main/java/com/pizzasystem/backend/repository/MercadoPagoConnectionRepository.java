package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.MercadoPagoConnection;
import com.pizzasystem.backend.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MercadoPagoConnectionRepository
        extends JpaRepository<MercadoPagoConnection, Long> {

    Optional<MercadoPagoConnection> findByStore(
            Store store
    );

    Optional<MercadoPagoConnection> findByStoreId(
            Long storeId
    );

    Optional<MercadoPagoConnection> findByStoreIdAndConnectedTrue(
            Long storeId
    );

    boolean existsByStoreIdAndConnectedTrue(
            Long storeId
    );
}