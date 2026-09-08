package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    // =========================
    // MÉTODOS ANTIGOS
    // =========================

    /*
     * Mantidos temporariamente para não
     * quebrar controllers durante a migração.
     */
    List<Product> findByCategoryId(
            Long categoryId
    );

    List<Product> findByAvailableTrue();

    // =========================
    // PRODUTOS POR LOJA
    // =========================

    List<Product> findByStoreIdOrderByIdAsc(
            Long storeId
    );

    List<Product> findByStoreIdAndAvailableTrueOrderByIdAsc(
            Long storeId
    );

    // =========================
    // PRODUTOS POR CATEGORIA + LOJA
    // =========================

    List<Product> findByStoreIdAndCategoryIdOrderByIdAsc(
            Long storeId,
            Long categoryId
    );

    List<Product> findByStoreIdAndCategoryIdAndAvailableTrueOrderByIdAsc(
            Long storeId,
            Long categoryId
    );

    // =========================
    // BUSCAR PRODUTO DA LOJA
    // =========================

    Optional<Product> findByIdAndStoreId(
            Long id,
            Long storeId
    );
}