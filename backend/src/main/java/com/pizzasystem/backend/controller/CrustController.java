package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.service.CrustService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(
        origins = "http://localhost:3000",
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/crusts")
public class CrustController {

    private final CrustService crustService;

    public CrustController(
            CrustService crustService
    ) {
        this.crustService =
                crustService;
    }

    // =========================
    // LISTAR TODAS
    // ADMIN
    // =========================

    @GetMapping
    public List<Crust> listAll() {

        return crustService
                .listAll();
    }

    // =========================
    // LISTAR ATIVAS
    // SITE PÚBLICO
    // =========================

    @GetMapping("/active")
    public List<Crust> listActive() {

        return crustService
                .listActive();
    }

    // =========================
    // BUSCAR POR ID
    // ADMIN
    // =========================

    @GetMapping("/{id}")
    public Crust findById(
            @PathVariable Long id
    ) {

        return crustService
                .findById(id);
    }

    // =========================
    // CRIAR
    // ADMIN
    // =========================

    @PostMapping
    @ResponseStatus(
            HttpStatus.CREATED
    )
    public Crust create(
            @RequestBody Crust crust
    ) {

        return crustService
                .create(crust);
    }

    // =========================
    // ATUALIZAR
    // ADMIN
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
    // ATIVAR / DESATIVAR
    // ADMIN
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