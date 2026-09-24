package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoreRepository
        extends JpaRepository<Store, Long> {

    Optional<Store> findBySlug(
            String slug
    );

    boolean existsBySlug(
            String slug
    );

    Optional<Store> findByOrbittaProductId(
            Long orbittaProductId
    );

    Optional<Store> findFirstByOrderByIdAsc();
}
