package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.AddonGroup;
import com.pizzasystem.backend.service.AddonGroupService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addon-groups")
public class AddonGroupController {

    private final AddonGroupService
            addonGroupService;

    public AddonGroupController(
            AddonGroupService addonGroupService
    ) {

        this.addonGroupService =
                addonGroupService;
    }

    // =========================
    // ADMIN - LISTAR TODOS
    // =========================

    @GetMapping
    public List<AddonGroup> listAll() {

        return addonGroupService
                .listAll();
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    public AddonGroup findById(
            @PathVariable Long id
    ) {

        return addonGroupService
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
    public AddonGroup create(
            @RequestBody AddonGroup group
    ) {

        return addonGroupService
                .create(
                        group
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @PutMapping("/{id}")
    public AddonGroup update(
            @PathVariable Long id,
            @RequestBody AddonGroup group
    ) {

        return addonGroupService
                .update(
                        id,
                        group
                );
    }

    // =========================
    // ADMIN - ATIVAR/DESATIVAR
    // =========================

    @PatchMapping("/{id}/active")
    public AddonGroup changeActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return addonGroupService
                .changeActive(
                        id,
                        active
                );
    }
}