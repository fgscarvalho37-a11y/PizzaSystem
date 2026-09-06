package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.service.CashService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/cash")
public class CashController {

    private final CashService cashService;

    public CashController(
            CashService cashService
    ) {
        this.cashService =
                cashService;
    }

    // =========================
    // CAIXA DE HOJE
    // =========================

    @GetMapping("/today")
    public Map<String, Object> getTodayCash() {

        LocalDate today =
                LocalDate.now();

        return cashService
                .getCashSummary(
                        today
                );
    }

    // =========================
    // CAIXA POR DATA
    // =========================

    @GetMapping
    public Map<String, Object> getCashByDate(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date
    ) {

        return cashService
                .getCashSummary(
                        date
                );
    }
}