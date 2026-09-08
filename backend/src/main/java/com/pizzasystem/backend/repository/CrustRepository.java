package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Crust;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CrustRepository
        extends JpaRepository<Crust, Long> {

    // =========================
    // BORDA POR LOJA
    // =========================

    Optional<Crust> findByIdAndStoreId(
            Long id,
            Long storeId
    );

    Optional<Crust> findByNameIgnoreCaseAndStoreId(
            String name,
            Long storeId
    );

    boolean existsByNameIgnoreCaseAndStoreId(
            String name,
            Long storeId
    );

    // =========================
    // TODAS DA LOJA
    // =========================

    List<Crust> findByStoreIdOrderBySortOrderAscNameAsc(
            Long storeId
    );

    // =========================
    // ATIVAS DA LOJA
    // =========================

    List<Crust> findByStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
            Long storeId
    );

    // =========================
    // MÉTODOS LEGADOS
    // =========================

    /*
     * Mantidos temporariamente enquanto
     * terminamos a migração SaaS.
     */

    Optional<Crust> findByNameIgnoreCase(
            String name
    );

    boolean existsByNameIgnoreCase(
            String name
    );

    List<Crust> findAllByOrderBySortOrderAscNameAsc();

    List<Crust> findByActiveTrueOrderBySortOrderAscNameAsc();
}