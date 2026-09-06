package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Coupon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponRepository
        extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCodeIgnoreCase(
            String code
    );

    boolean existsByCodeIgnoreCase(
            String code
    );

    List<Coupon> findAllByOrderByCreatedAtDesc();
}