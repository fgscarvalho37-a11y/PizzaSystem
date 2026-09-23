package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Addon;
import com.pizzasystem.backend.service.AddonService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addon-groups/{groupId}/addons")
public class AddonController {

    private final AddonService
            addonService;

    public AddonController(
            AddonService addonService
    ) {

        this.addonService =
                addonService;
    }

    // =========================
    // ADMIN - LISTAR POR GRUPO
    // =========================

    @GetMapping
    public List<Addon> listByGroup(
            @PathVariable Long groupId
    ) {

        return addonService
                .listByGroup(
                        groupId
                );
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    public Addon findById(
            @PathVariable Long groupId,
            @PathVariable Long id
    ) {

        return addonService
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
    public Addon create(
            @PathVariable Long groupId,
            @RequestBody Addon addon
    ) {

        return addonService
                .create(
                        groupId,
                        addon
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @PutMapping("/{id}")
    public Addon update(
            @PathVariable Long groupId,
            @PathVariable Long id,
            @RequestBody Addon addon
    ) {

        return addonService
                .update(
                        groupId,
                        id,
                        addon
                );
    }

    // =========================
    // ADMIN - ATIVAR/DESATIVAR
    // =========================

    @PatchMapping("/{id}/active")
    public Addon changeActive(
            @PathVariable Long groupId,
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return addonService
                .changeActive(
                        id,
                        active
                );
    }
}