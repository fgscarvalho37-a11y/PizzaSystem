package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.BusinessHours;
import com.pizzasystem.backend.repository.BusinessHoursRepository;

import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.Comparator;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/business-hours")
public class BusinessHoursController {

    private final BusinessHoursRepository repository;

    public BusinessHoursController(
            BusinessHoursRepository repository
    ) {
        this.repository = repository;
    }

    @GetMapping
    public List<BusinessHours> listAll() {
        return repository.findAll()
                .stream()
                .sorted(
                        Comparator.comparing(
                                BusinessHours::getDayOfWeek
                        )
                )
                .toList();
    }

    @PutMapping("/{day}")
    public BusinessHours update(
            @PathVariable DayOfWeek day,
            @RequestBody BusinessHours data
    ) {
        BusinessHours hours =
                repository.findByDayOfWeek(day)
                        .orElseGet(BusinessHours::new);

        hours.setDayOfWeek(day);
        hours.setOpeningTime(data.getOpeningTime());
        hours.setClosingTime(data.getClosingTime());
        hours.setEnabled(data.isEnabled());

        return repository.save(hours);
    }
}