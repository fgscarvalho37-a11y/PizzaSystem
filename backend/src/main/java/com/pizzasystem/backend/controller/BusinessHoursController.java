package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.BusinessHours;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.BusinessHoursRepository;

import com.pizzasystem.backend.service.CurrentStoreService;

import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

@RestController
@RequestMapping("/api/business-hours")
public class BusinessHoursController {

    private final BusinessHoursRepository
            repository;

    private final CurrentStoreService
            currentStoreService;

    public BusinessHoursController(
            BusinessHoursRepository repository,
            CurrentStoreService currentStoreService
    ) {

        this.repository =
                repository;

        this.currentStoreService =
                currentStoreService;
    }

    // =========================
    // ADMIN - LISTAR HORÁRIOS
    // =========================

    @GetMapping
    public List<BusinessHours> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return repository
                .findByStoreIdOrderByDayOfWeekAsc(
                        storeId
                );
    }

    // =========================
    // ADMIN - ATUALIZAR DIA
    // =========================

    @PutMapping("/{day}")
    public BusinessHours update(
            @PathVariable DayOfWeek day,
            @RequestBody BusinessHours data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        BusinessHours hours =
                repository
                        .findByStoreIdAndDayOfWeek(
                                store.getId(),
                                day
                        )
                        .orElseGet(() -> {

                            BusinessHours newHours =
                                    new BusinessHours();

                            newHours.setStore(
                                    store
                            );

                            newHours.setDayOfWeek(
                                    day
                            );

                            return newHours;
                        });

        hours.setStore(
                store
        );

        hours.setDayOfWeek(
                day
        );

        hours.setOpeningTime(
                data.getOpeningTime()
        );

        hours.setClosingTime(
                data.getClosingTime()
        );

        hours.setEnabled(
                data.isEnabled()
        );

        return repository.save(
                hours
        );
    }
}