package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.DeliveryAreaRepository;
import com.pizzasystem.backend.repository.StoreRepository;

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

    private final StoreRepository
            storeRepository;

    private final CurrentStoreService
            currentStoreService;

    private final PublicStoreService
            publicStoreService;

    private final DeliveryQuoteService
            deliveryQuoteService;

    public DeliveryAreaController(
            DeliveryAreaRepository deliveryAreaRepository,
            StoreRepository storeRepository,
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService,
            DeliveryQuoteService deliveryQuoteService
    ) {

        this.deliveryAreaRepository =
                deliveryAreaRepository;

        this.storeRepository =
                storeRepository;

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
                store.getDeliveryPricingMode(),
                store.getDeliveryOriginAddress(),
                store.getDeliveryOriginLatitude(),
                store.getDeliveryOriginLongitude(),
                store.getDeliveryMaxDistanceKm(),
                store.getDeliveryFeePerKm(),
                store.getDeliveryFreeAbove(),
                store.getDeliveryFreeDistanceKm(),
                deliveryQuoteService.isConfigured(),
                deliveryQuoteService.getProviderName()
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

        String pricingMode = request != null && request.pricingMode() != null
                ? request.pricingMode().trim().toUpperCase(java.util.Locale.ROOT)
                : store.getDeliveryPricingMode();
        if (!"FIXED".equals(pricingMode) && !"PER_KM".equals(pricingMode)) {
            throw new IllegalArgumentException("Tipo de taxa inválido.");
        }

        String originAddress =
                request != null
                        ? cleanNullable(
                                request.originAddress()
                        )
                        : null;

        Double originLatitude =
                request != null
                        ? request.originLatitude()
                        : null;

        Double originLongitude =
                request != null
                        ? request.originLongitude()
                        : null;

        BigDecimal maxDistanceKm =
                request != null
                        ? request.maxDistanceKm()
                        : null;

        BigDecimal feePerKm =
                request != null
                        ? request.feePerKm()
                        : null;

        BigDecimal freeDeliveryAbove =
                request != null
                        ? request.freeDeliveryAbove()
                        : null;

        BigDecimal freeDeliveryDistanceKm =
                request != null
                        ? request.freeDeliveryDistanceKm()
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

        if (
                "PER_KM".equals(pricingMode) && (feePerKm == null ||
                feePerKm.compareTo(
                        BigDecimal.ZERO
                ) < 0)
        ) {

            throw new IllegalArgumentException(
                    "O valor por km deve ser zero ou maior."
            );
        }

        if (
                freeDeliveryAbove != null &&
                freeDeliveryAbove.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {

            throw new IllegalArgumentException(
                    "O valor para frete grátis deve ser maior que zero."
            );
        }

        if (
                freeDeliveryDistanceKm != null &&
                freeDeliveryDistanceKm.compareTo(
                        BigDecimal.ZERO
                ) <= 0
        ) {

            throw new IllegalArgumentException(
                    "A distância de frete grátis deve ser maior que zero."
            );
        }

        if (
                freeDeliveryDistanceKm != null &&
                maxDistanceKm != null &&
                freeDeliveryDistanceKm.compareTo(
                        maxDistanceKm
                ) > 0
        ) {

            throw new IllegalArgumentException(
                    "A distância de frete grátis não pode ser maior que a distância máxima."
            );
        }

        if ("PER_KM".equals(pricingMode) &&
                (originAddress == null || originAddress.split(",").length < 3)) {
            throw new IllegalArgumentException("Informe rua, número, bairro e cidade no endereço de saída da pizzaria.");
        }

        store.setDeliveryPricingMode(pricingMode);

        if ((originLatitude == null) != (originLongitude == null)) {
            throw new IllegalArgumentException(
                    "Latitude e longitude da pizzaria precisam ser informadas juntas."
            );
        }

        if (originLatitude != null &&
                (!Double.isFinite(originLatitude) ||
                        originLatitude < -90 ||
                        originLatitude > 90 ||
                        !Double.isFinite(originLongitude) ||
                        originLongitude < -180 ||
                        originLongitude > 180)) {
            throw new IllegalArgumentException(
                    "Localização da pizzaria inválida."
            );
        }

        store.setDeliveryOriginAddress(
                originAddress
        );

        store.setDeliveryOriginLatitude(
                originLatitude
        );

        store.setDeliveryOriginLongitude(
                originLongitude
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

        store.setDeliveryFeePerKm(
                feePerKm != null ? feePerKm.setScale(
                        2,
                        RoundingMode.HALF_UP
                ) : null
        );

        store.setDeliveryFreeAbove(
                freeDeliveryAbove != null
                        ? freeDeliveryAbove
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : null
        );

        store.setDeliveryFreeDistanceKm(
                freeDeliveryDistanceKm != null
                        ? freeDeliveryDistanceKm
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : null
        );

        Store saved =
                storeRepository
                        .saveAndFlush(
                                store
                        );

        return new DeliveryConfigResponse(
                saved.getDeliveryPricingMode(),
                saved.getDeliveryOriginAddress(),
                saved.getDeliveryOriginLatitude(),
                saved.getDeliveryOriginLongitude(),
                saved.getDeliveryMaxDistanceKm(),
                saved.getDeliveryFeePerKm(),
                saved.getDeliveryFreeAbove(),
                saved.getDeliveryFreeDistanceKm(),
                deliveryQuoteService.isConfigured(),
                deliveryQuoteService.getProviderName()
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

        return deliveryQuoteService
                .quote(
                        publicStore,
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
            String pricingMode,
            String originAddress,
            Double originLatitude,
            Double originLongitude,
            BigDecimal maxDistanceKm,
            BigDecimal feePerKm,
            BigDecimal freeDeliveryAbove,
            BigDecimal freeDeliveryDistanceKm
    ) {
    }

    public record DeliveryConfigResponse(
            String pricingMode,
            String originAddress,
            Double originLatitude,
            Double originLongitude,
            BigDecimal maxDistanceKm,
            BigDecimal feePerKm,
            BigDecimal freeDeliveryAbove,
            BigDecimal freeDeliveryDistanceKm,
            boolean mapsConfigured,
            String routeProvider
    ) {
    }
}
