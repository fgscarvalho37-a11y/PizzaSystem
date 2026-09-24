package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.service.ReportService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(
            ReportService reportService
    ) {
        this.reportService =
                reportService;
    }

    // =========================
    // RELATÓRIO POR PERÍODO
    // =========================

    @GetMapping
    public Map<String, Object> getReport(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate startDate,

            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate endDate
    ) {

        return reportService.getReport(
                startDate,
                endDate
        );
    }

    // =========================
    // RELATÓRIO DE HOJE
    // =========================

    @GetMapping("/today")
    public Map<String, Object> getTodayReport() {

        LocalDate today =
                LocalDate.now();

        return reportService.getReport(
                today,
                today
        );
    }
}