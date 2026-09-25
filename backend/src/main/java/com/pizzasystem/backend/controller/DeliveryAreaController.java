package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.DeliveryAreaRepository;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
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

    @GetMapping
    public List<DeliveryArea> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return deliveryAreaRepository
                .findByStoreIdOrderByCityAscNeighborhoodAsc(
                        storeId
                );
    }

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
                .findByStoreIdAndActiveTrueOrderByCityAscNeighborhoodAsc(
                        storeId
                );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryArea create(
            @RequestBody DeliveryArea data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String city =
                normalizeRequired(
                        data.getCity(),
                        "Cidade"
                );

        String neighborhood =
                normalizeRequired(
                        data.getNeighborhood(),
                        "Bairro"
                );

        if (
                deliveryAreaRepository
                        .existsByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCase(
                                store.getId(),
                                city,
                                neighborhood
                        )
        ) {

            throw new IllegalArgumentException(
                    "Já existe uma área de entrega para este bairro nesta cidade."
            );
        }

        DeliveryArea deliveryArea =
                new DeliveryArea();

        deliveryArea.setStore(
                store
        );

        deliveryArea.setCity(
                city
        );

        deliveryArea.setNeighborhood(
                neighborhood
        );

        applyPricing(
                deliveryArea,
                data
        );

        deliveryArea.setActive(
                data.isActive()
        );

        return deliveryAreaRepository
                .save(
                        deliveryArea
                );
    }

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

        String city =
                normalizeRequired(
                        data.getCity(),
                        "Cidade"
                );

        String neighborhood =
                normalizeRequired(
                        data.getNeighborhood(),
                        "Bairro"
                );

        deliveryAreaRepository
                .findByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCase(
                        store.getId(),
                        city,
                        neighborhood
                )
                .ifPresent(
                        existing -> {

                            if (!existing.getId()
                                    .equals(
                                            deliveryArea.getId()
                                    )) {

                                throw new IllegalArgumentException(
                                        "Já existe uma área de entrega para este bairro nesta cidade."
                                );
                            }
                        }
                );

        deliveryArea.setCity(
                city
        );

        deliveryArea.setNeighborhood(
                neighborhood
        );

        applyPricing(
                deliveryArea,
                data
        );

        deliveryArea.setActive(
                data.isActive()
        );

        return deliveryAreaRepository
                .save(
                        deliveryArea
                );
    }

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

    private void applyPricing(
            DeliveryArea target,
            DeliveryArea data
    ) {

        String mode =
                data.getPricingMode() == null
                        ? "FIXED"
                        : data.getPricingMode()
                                .trim()
                                .toUpperCase();

        if (
                !"FIXED".equals(
                        mode
                ) &&
                !"PER_KM".equals(
                        mode
                )
        ) {
            throw new IllegalArgumentException(
                    "Tipo de taxa inválido."
            );
        }

        target.setPricingMode(
                mode
        );

        if (
                "FIXED".equals(
                        mode
                )
        ) {

            BigDecimal fee =
                    requireNonNegative(
                            data.getFee(),
                            "Taxa fixa"
                    );

            target.setFee(
                    fee.setScale(
                            2,
                            RoundingMode.HALF_UP
                    )
            );

            target.setDistanceKm(
                    null
            );

            target.setFeePerKm(
                    null
            );

            return;
        }

        BigDecimal distanceKm =
                requirePositive(
                        data.getDistanceKm(),
                        "Distância em km"
                );

        BigDecimal feePerKm =
                requireNonNegative(
                        data.getFeePerKm(),
                        "Valor por km"
                );

        BigDecimal calculatedFee =
                distanceKm
                        .multiply(
                                feePerKm
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        target.setDistanceKm(
                distanceKm.setScale(
                        2,
                        RoundingMode.HALF_UP
                )
        );

        target.setFeePerKm(
                feePerKm.setScale(
                        2,
                        RoundingMode.HALF_UP
                )
        );

        target.setFee(
                calculatedFee
        );
    }

    private String normalizeRequired(
            String value,
            String field
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    field + " é obrigatório."
            );
        }

        return value
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    private BigDecimal requireNonNegative(
            BigDecimal value,
            String field
    ) {

        if (
                value == null ||
                value.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {
            throw new IllegalArgumentException(
                    field + " inválido."
            );
        }

        return value;
    }

    private BigDecimal requirePositive(
            BigDecimal value,
            String field
    ) {

        if (
                value == null ||
                value.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {
            throw new IllegalArgumentException(
                    field + " deve ser maior que zero."
            );
        }

        return value;
    }
}
