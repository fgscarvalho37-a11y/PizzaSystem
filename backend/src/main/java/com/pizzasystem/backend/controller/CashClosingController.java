package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.CashClosing;
import com.pizzasystem.backend.service.CashClosingService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/cash-closings")
public class CashClosingController {

    private final CashClosingService cashClosingService;

    public CashClosingController(
            CashClosingService cashClosingService
    ) {
        this.cashClosingService =
                cashClosingService;
    }

    // =========================
    // FECHAR CAIXA
    // =========================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CashClosing closeCash(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date
    ) {

        return cashClosingService
                .closeCash(
                        date
                );
    }

    // =========================
    // BUSCAR FECHAMENTO POR DATA
    // =========================

    @GetMapping
    public CashClosing getByDate(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date
    ) {

        return cashClosingService
                .getByDate(
                        date
                );
    }

    // =========================
    // VERIFICAR SE JÁ FECHOU
    // =========================

    @GetMapping("/status")
    public Map<String, Object> getStatus(
            @RequestParam
            @DateTimeFormat(
                    iso = DateTimeFormat.ISO.DATE
            )
            LocalDate date
    ) {

        boolean closed =
                cashClosingService
                        .isClosed(
                                date
                        );

        return Map.of(
                "date",
                date,
                "closed",
                closed
        );
    }

    // =========================
    // HISTÓRICO DE FECHAMENTOS
    // =========================

    @GetMapping("/history")
    public List<CashClosing> history() {

        return cashClosingService
                .listAll();
    }
}