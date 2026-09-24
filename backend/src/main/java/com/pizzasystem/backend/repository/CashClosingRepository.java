package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.CashClosing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CashClosingRepository
        extends JpaRepository<CashClosing, Long> {

    Optional<CashClosing> findByStoreIdAndDate(
            Long storeId,
            LocalDate date
    );

    boolean existsByStoreIdAndDate(
            Long storeId,
            LocalDate date
    );

    List<CashClosing> findByStoreIdOrderByDateDesc(
            Long storeId
    );
}
