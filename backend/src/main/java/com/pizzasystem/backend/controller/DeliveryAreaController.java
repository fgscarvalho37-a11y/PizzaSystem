package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.DeliveryAreaRepository;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-areas")
public class DeliveryAreaController {

    private final DeliveryAreaRepository
            deliveryAreaRepository;

    private final CurrentStoreService
            currentStoreService;

    private final PublicStoreService
            publicStoreService;

    public DeliveryAreaController(
            DeliveryAreaRepository deliveryAreaRepository,
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService
    ) {

        this.deliveryAreaRepository =
                deliveryAreaRepository;

        this.currentStoreService =
                currentStoreService;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // ADMIN - LISTAR TODAS
    // =========================

    @GetMapping
    public List<DeliveryArea> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return deliveryAreaRepository
                .findByStoreIdOrderByNeighborhoodAsc(
                        storeId
                );
    }

    // =========================
    // PÚBLICO - LISTAR ATIVAS
    // =========================

    @GetMapping("/active")
    public List<DeliveryArea> listActive(
            @RequestParam String store
    ) {

        Long storeId =
                publicStoreService
                        .getStoreIdBySlug(
                                store
                        );

        return deliveryAreaRepository
                .findByStoreIdAndActiveTrueOrderByNeighborhoodAsc(
                        storeId
                );
    }

    // =========================
    // ADMIN - CADASTRAR
    // =========================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryArea create(
            @RequestBody DeliveryArea data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String neighborhood =
                normalizeNeighborhood(
                        data.getNeighborhood()
                );

        if (
                deliveryAreaRepository
                        .existsByStoreIdAndNeighborhoodIgnoreCase(
                                store.getId(),
                                neighborhood
                        )
        ) {

            throw new IllegalArgumentException(
                    "Já existe uma área de entrega com este bairro."
            );
        }

        DeliveryArea deliveryArea =
                new DeliveryArea();

        deliveryArea.setNeighborhood(
                neighborhood
        );

        deliveryArea.setFee(
                data.getFee()
        );

        deliveryArea.setActive(
                data.isActive()
        );

        deliveryArea.setStore(
                store
        );

        return deliveryAreaRepository
                .save(
                        deliveryArea
                );
    }

    // =========================
    // ADMIN - EDITAR
    // =========================

    @PutMapping("/{id}")
    public DeliveryArea update(
            @PathVariable Long id,
            @RequestBody DeliveryArea data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        DeliveryArea deliveryArea =
                deliveryAreaRepository
                        .findByIdAndStoreId(
                                id,
                                store.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Área de entrega não encontrada"
                                )
                        );

        String neighborhood =
                normalizeNeighborhood(
                        data.getNeighborhood()
                );

        deliveryAreaRepository
                .findByStoreIdAndNeighborhoodIgnoreCase(
                        store.getId(),
                        neighborhood
                )
                .ifPresent(
                        existing -> {

                            if (!existing.getId()
                                    .equals(
                                            deliveryArea.getId()
                                    )) {

                                throw new IllegalArgumentException(
                                        "Já existe uma área de entrega com este bairro."
                                );
                            }
                        }
                );

        deliveryArea.setNeighborhood(
                neighborhood
        );

        deliveryArea.setFee(
                data.getFee()
        );

        deliveryArea.setActive(
                data.isActive()
        );

        deliveryArea.setStore(
                store
        );

        return deliveryAreaRepository
                .save(
                        deliveryArea
                );
    }

    // =========================
    // ADMIN - ATIVAR / DESATIVAR
    // =========================

    @PatchMapping("/{id}/active")
    public DeliveryArea changeActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        DeliveryArea deliveryArea =
                deliveryAreaRepository
                        .findByIdAndStoreId(
                                id,
                                storeId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Área de entrega não encontrada"
                                )
                        );

        deliveryArea.setActive(
                active
        );

        return deliveryAreaRepository
                .save(
                        deliveryArea
                );
    }

    // =========================
    // NORMALIZAR BAIRRO
    // =========================

    private String normalizeNeighborhood(
            String neighborhood
    ) {

        if (neighborhood == null
                || neighborhood.isBlank()) {

            throw new IllegalArgumentException(
                    "Bairro é obrigatório."
            );
        }

        return neighborhood
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }
}