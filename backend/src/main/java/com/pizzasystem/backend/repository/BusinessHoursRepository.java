package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.BusinessHours;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface BusinessHoursRepository
        extends JpaRepository<BusinessHours, Long> {

    // =========================
    // HORÁRIOS POR STORE
    // =========================

    Optional<BusinessHours>
    findByStoreIdAndDayOfWeek(
            Long storeId,
            DayOfWeek dayOfWeek
    );

    Optional<BusinessHours>
    findByIdAndStoreId(
            Long id,
            Long storeId
    );

    List<BusinessHours>
    findByStoreIdOrderByDayOfWeekAsc(
            Long storeId
    );

    // =========================
    // LEGADO
    // =========================

    /*
     * Temporariamente mantido para a
     * migração dos horários antigos.
     */
    Optional<BusinessHours>
    findByDayOfWeek(
            DayOfWeek dayOfWeek
    );
}