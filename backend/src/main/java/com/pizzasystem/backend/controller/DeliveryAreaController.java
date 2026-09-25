package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.DeliveryAreaRepository;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.DeliveryQuoteService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.http.HttpStatus;

import org.springframework.transaction.annotation.Transactional;

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

    private final DeliveryQuoteService
            deliveryQuoteService;

    public DeliveryAreaController(
            DeliveryAreaRepository deliveryAreaRepository,
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService,
            DeliveryQuoteService deliveryQuoteService
    ) {

        this.deliveryAreaRepository =
                deliveryAreaRepository;

        this.currentStoreService =
                currentStoreService;

        this.publicStoreService =
                publicStoreService;

        this.deliveryQuoteService =
                deliveryQuoteService;
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

    // =========================
    // CONFIGURAÇÃO DO CÁLCULO POR KM - ADMIN
    // =========================

    @GetMapping("/config")
    @Transactional(readOnly = true)
    public DeliveryConfigResponse getConfig() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return new DeliveryConfigResponse(
                store.getDeliveryOriginAddress(),
                store.getDeliveryMaxDistanceKm(),
                deliveryQuoteService.isConfigured()
        );
    }

    @PutMapping("/config")
    @Transactional
    public DeliveryConfigResponse updateConfig(
            @RequestBody DeliveryConfigRequest request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String originAddress =
                request != null
                        ? cleanNullable(
                                request.originAddress()
                        )
                        : null;

        BigDecimal maxDistanceKm =
                request != null
                        ? request.maxDistanceKm()
                        : null;

        if (
                maxDistanceKm != null &&
                maxDistanceKm.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {

            throw new IllegalArgumentException(
                    "A distância máxima deve ser maior que zero."
            );
        }

        store.setDeliveryOriginAddress(
                originAddress
        );

        store.setDeliveryMaxDistanceKm(
                maxDistanceKm != null
                        ? maxDistanceKm
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : null
        );

        return new DeliveryConfigResponse(
                store.getDeliveryOriginAddress(),
                store.getDeliveryMaxDistanceKm(),
                deliveryQuoteService.isConfigured()
        );
    }

    // =========================
    // COTAÇÃO PÚBLICA DA ENTREGA
    // =========================

    @PostMapping("/quote")
    @Transactional(readOnly = true)
    public DeliveryQuoteResponse quote(
            @RequestParam String store,
            @RequestBody DeliveryQuoteRequest request
    ) {

        Store publicStore =
                publicStoreService
                        .getBySlug(
                                store
                        );

        String city =
                normalizeRequired(
                        request != null
                                ? request.city()
                                : null,
                        "Cidade"
                );

        String neighborhood =
                normalizeRequired(
                        request != null
                                ? request.neighborhood()
                                : null,
                        "Bairro"
                );

        DeliveryArea area =
                deliveryAreaRepository
                        .findByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCaseAndActiveTrue(
                                publicStore.getId(),
                                city,
                                neighborhood
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Não realizamos entrega para este bairro."
                                        )
                        );

        return deliveryQuoteService
                .quote(
                        publicStore,
                        area,
                        request
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

        BigDecimal feePerKm =
                requireNonNegative(
                        data.getFeePerKm(),
                        "Valor por km"
                );

        /*
         * A distância não é mais cadastrada manualmente.
         * Ela é obtida da rota real no checkout.
         */
        target.setDistanceKm(
                null
        );

        target.setFeePerKm(
                feePerKm.setScale(
                        2,
                        RoundingMode.HALF_UP
                )
        );

        /*
         * O campo fee continua preenchido por compatibilidade
         * com o schema existente. Para PER_KM o valor real
         * sempre é recalculado no servidor.
         */
        target.setFee(
                BigDecimal.ZERO
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        )
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

    private String cleanNullable(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            return null;
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

    public record DeliveryConfigRequest(
            String originAddress,
            BigDecimal maxDistanceKm
    ) {
    }

    public record DeliveryConfigResponse(
            String originAddress,
            BigDecimal maxDistanceKm,
            boolean mapsConfigured
    ) {
    }
}
