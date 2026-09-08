package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.service.CrustService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crusts")
public class CrustController {

    private final CrustService
            crustService;

    public CrustController(
            CrustService crustService
    ) {

        this.crustService =
                crustService;
    }

    // =========================
    // ADMIN - LISTAR TODAS
    // =========================

    @GetMapping
    public List<Crust> listAll() {

        return crustService
                .listAll();
    }

    // =========================
    // PÚBLICO - LISTAR ATIVAS
    // =========================

    @GetMapping("/active")
    public List<Crust> listActive(
            @RequestParam String store
    ) {

        return crustService
                .listActive(
                        store
                );
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    public Crust findById(
            @PathVariable Long id
    ) {

        return crustService
                .findById(
                        id
                );
    }

    // =========================
    // ADMIN - CRIAR
    // =========================

    @PostMapping
    @ResponseStatus(
            HttpStatus.CREATED
    )
    public Crust create(
            @RequestBody Crust crust
    ) {

        return crustService
                .create(
                        crust
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @PutMapping("/{id}")
    public Crust update(
            @PathVariable Long id,
            @RequestBody Crust crust
    ) {

        return crustService
                .update(
                        id,
                        crust
                );
    }

    // =========================
    // ADMIN - ATIVAR/DESATIVAR
    // =========================

    @PatchMapping("/{id}/active")
    public Crust changeActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return crustService
                .changeActive(
                        id,
                        active
                );
    }
}