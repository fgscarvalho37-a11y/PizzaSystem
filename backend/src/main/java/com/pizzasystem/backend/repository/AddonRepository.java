package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Addon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AddonRepository
        extends JpaRepository<Addon, Long> {

    // =========================
    // ADICIONAL POR LOJA
    // =========================

    Optional<Addon> findByIdAndStoreId(
            Long id,
            Long storeId
    );

    // =========================
    // ADICIONAL POR GRUPO + LOJA
    // =========================

    Optional<Addon> findByNameIgnoreCaseAndGroupIdAndStoreId(
            String name,
            Long groupId,
            Long storeId
    );

    boolean existsByNameIgnoreCaseAndGroupIdAndStoreId(
            String name,
            Long groupId,
            Long storeId
    );

    // =========================
    // TODOS DO GRUPO
    // =========================

    List<Addon> findByGroupIdAndStoreIdOrderBySortOrderAscNameAsc(
            Long groupId,
            Long storeId
    );

    // =========================
    // ATIVOS DO GRUPO
    // =========================

    List<Addon> findByGroupIdAndStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
            Long groupId,
            Long storeId
    );

    // =========================
    // TODOS DA LOJA
    // =========================

    List<Addon> findByStoreIdOrderBySortOrderAscNameAsc(
            Long storeId
    );
}