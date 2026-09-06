package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.CashClosing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CashClosingRepository
        extends JpaRepository<CashClosing, Long> {

    // =========================
    // FECHAMENTO POR DATA
    // =========================

    Optional<CashClosing> findByDate(
            LocalDate date
    );

    // =========================
    // VERIFICAR SE JÁ FECHOU
    // =========================

    boolean existsByDate(
            LocalDate date
    );

    // =========================
    // HISTÓRICO DE FECHAMENTOS
    // =========================

    List<CashClosing> findAllByOrderByDateDesc();
}