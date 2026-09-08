package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Category;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository
        extends JpaRepository<Category, Long> {

    // =========================
    // POR LOJA
    // =========================

    List<Category> findByStoreIdOrderByIdAsc(
            Long storeId
    );

    Optional<Category> findByIdAndStoreId(
            Long id,
            Long storeId
    );

    boolean existsByNameIgnoreCaseAndStoreId(
            String name,
            Long storeId
    );
}