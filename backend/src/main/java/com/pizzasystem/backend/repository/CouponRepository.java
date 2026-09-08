package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Coupon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository
        extends JpaRepository<Coupon, Long> {

    // =========================
    // CUPOM DA LOJA POR ID
    // =========================

    Optional<Coupon> findByIdAndStoreId(
            Long id,
            Long storeId
    );

    // =========================
    // CUPOM DA LOJA POR CÓDIGO
    // =========================

    Optional<Coupon>
    findByStoreIdAndCodeIgnoreCase(
            Long storeId,
            String code
    );

    boolean existsByStoreIdAndCodeIgnoreCase(
            Long storeId,
            String code
    );

    // =========================
    // CUPONS DA LOJA
    // =========================

    List<Coupon>
    findByStoreIdOrderByCreatedAtDesc(
            Long storeId
    );

    // =========================
    // MÉTODOS LEGADOS
    // =========================

    /*
     * Temporários.
     *
     * Continuam aqui enquanto outras
     * partes antigas do sistema ainda
     * não foram convertidas para Store.
     */

    Optional<Coupon> findByCodeIgnoreCase(
            String code
    );

    boolean existsByCodeIgnoreCase(
            String code
    );

    List<Coupon>
    findAllByOrderByCreatedAtDesc();
}