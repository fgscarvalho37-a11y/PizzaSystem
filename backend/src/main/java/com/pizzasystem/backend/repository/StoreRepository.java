package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StoreRepository
        extends JpaRepository<Store, Long> {

    // =========================
    // BUSCAR POR SLUG
    // =========================

    Optional<Store> findBySlug(
            String slug
    );

    boolean existsBySlug(
            String slug
    );

    // =========================
    // MIGRAÇÃO LEGADA
    // =========================

    /*
     * Mantido temporariamente apenas para
     * StoreDataMigrationConfig.
     *
     * Controllers não devem usar isso
     * para descobrir a loja atual.
     */
    Optional<Store> findFirstByOrderByIdAsc();
}