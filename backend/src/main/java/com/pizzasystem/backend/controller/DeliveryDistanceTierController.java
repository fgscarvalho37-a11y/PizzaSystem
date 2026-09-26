package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.DeliveryDistanceTier;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.DeliveryDistanceTierRepository;
import com.pizzasystem.backend.service.CurrentStoreService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/delivery-distance-tiers")
public class DeliveryDistanceTierController {

    private final DeliveryDistanceTierRepository
            repository;

    private final CurrentStoreService
            currentStoreService;

    public DeliveryDistanceTierController(
            DeliveryDistanceTierRepository repository,
            CurrentStoreService currentStoreService
    ) {
        this.repository =
                repository;

        this.currentStoreService =
                currentStoreService;
    }

    @GetMapping
    public List<DeliveryDistanceTier> list() {
        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return repository
                .findByStoreIdOrderByMinDistanceKmAsc(
                        storeId
                );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryDistanceTier create(
            @RequestBody DeliveryDistanceTier data
    ) {
        Store store =
                currentStoreService
                        .getCurrentStore();

        DeliveryDistanceTier tier =
                new DeliveryDistanceTier();

        tier.setStore(
                store
        );

        apply(
                tier,
                data,
                store.getId(),
                null
        );

        return repository.save(
                tier
        );
    }

    @PutMapping("/{id}")
    public DeliveryDistanceTier update(
            @PathVariable Long id,
            @RequestBody DeliveryDistanceTier data
    ) {
        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        DeliveryDistanceTier tier =
                repository
                        .findByIdAndStoreId(
                                id,
                                storeId
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Faixa de entrega não encontrada."
                                        )
                        );

        apply(
                tier,
                data,
                storeId,
                id
        );

        return repository.save(
                tier
        );
    }

    @PatchMapping("/{id}/active")
    public DeliveryDistanceTier changeActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        DeliveryDistanceTier tier =
                repository
                        .findByIdAndStoreId(
                                id,
                                storeId
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Faixa de entrega não encontrada."
                                        )
                        );

        if (active) {
            validateNoOverlap(
                    storeId,
                    id,
                    tier.getMinDistanceKm(),
                    tier.getMaxDistanceKm()
            );
        }

        tier.setActive(
                active
        );

        return repository.save(
                tier
        );
    }

    private void apply(
            DeliveryDistanceTier target,
            DeliveryDistanceTier data,
            Long storeId,
            Long currentId
    ) {
        if (data == null) {
            throw new IllegalArgumentException(
                    "Informe os dados da faixa."
            );
        }

        BigDecimal minDistance =
                data.getMinDistanceKm();

        BigDecimal maxDistance =
                data.getMaxDistanceKm();

        BigDecimal fee =
                data.getFee();

        if (
                minDistance == null ||
                minDistance.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {
            throw new IllegalArgumentException(
                    "A distância inicial deve ser zero ou maior."
            );
        }

        if (
                maxDistance == null ||
                maxDistance.compareTo(
                        BigDecimal.ZERO
                ) <= 0 ||
                maxDistance.compareTo(
                        minDistance
                ) <= 0
        ) {
            throw new IllegalArgumentException(
                    "A distância final deve ser maior que a distância inicial."
            );
        }

        if (
                fee == null ||
                fee.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {
            throw new IllegalArgumentException(
                    "O valor da faixa deve ser zero ou maior."
            );
        }

        BigDecimal normalizedMin =
                minDistance.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        BigDecimal normalizedMax =
                maxDistance.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        boolean active =
                data.isActive();

        if (active) {
            validateNoOverlap(
                    storeId,
                    currentId,
                    normalizedMin,
                    normalizedMax
            );
        }

        target.setMinDistanceKm(
                normalizedMin
        );

        target.setMaxDistanceKm(
                normalizedMax
        );

        target.setFee(
                fee.setScale(
                        2,
                        RoundingMode.HALF_UP
                )
        );

        target.setActive(
                active
        );
    }

    private void validateNoOverlap(
            Long storeId,
            Long currentId,
            BigDecimal minDistance,
            BigDecimal maxDistance
    ) {
        for (
                DeliveryDistanceTier existing :
                repository
                        .findByStoreIdAndActiveTrueOrderByMinDistanceKmAsc(
                                storeId
                        )
        ) {
            if (
                    currentId != null &&
                    currentId.equals(
                            existing.getId()
                    )
            ) {
                continue;
            }

            boolean overlaps =
                    minDistance.compareTo(
                            existing.getMaxDistanceKm()
                    ) < 0 &&
                    maxDistance.compareTo(
                            existing.getMinDistanceKm()
                    ) > 0;

            if (overlaps) {
                throw new IllegalArgumentException(
                        "Esta faixa se sobrepõe a outra faixa ativa."
                );
            }
        }
    }
}
