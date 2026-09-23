package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.AddonGroup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddonGroupRepository
        extends JpaRepository<AddonGroup, Long> {

    // =========================
    // GRUPO POR LOJA
    // =========================

    Optional<AddonGroup> findByIdAndStoreId(
            Long id,
            Long storeId
    );

    Optional<AddonGroup> findByNameIgnoreCaseAndStoreId(
            String name,
            Long storeId
    );

    boolean existsByNameIgnoreCaseAndStoreId(
            String name,
            Long storeId
    );

    // =========================
    // TODOS OS GRUPOS DA LOJA
    // =========================

    List<AddonGroup> findByStoreIdOrderBySortOrderAscNameAsc(
            Long storeId
    );

    // =========================
    // SOMENTE GRUPOS ATIVOS
    // =========================

    List<AddonGroup> findByStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
            Long storeId
    );
}