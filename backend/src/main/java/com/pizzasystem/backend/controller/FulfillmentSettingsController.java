package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.StoreRepository;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/store/fulfillment")
public class FulfillmentSettingsController {

    private final CurrentStoreService currentStoreService;
    private final PublicStoreService publicStoreService;
    private final StoreRepository storeRepository;

    public FulfillmentSettingsController(
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService,
            StoreRepository storeRepository
    ) {
        this.currentStoreService =
                currentStoreService;
        this.publicStoreService =
                publicStoreService;
        this.storeRepository =
                storeRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public FulfillmentSettingsResponse get(
            @RequestParam(
                    required = false
            )
            String store
    ) {
        Store target =
                store != null &&
                !store.isBlank()
                        ? publicStoreService
                                .getBySlug(
                                        store.trim()
                                )
                        : currentStoreService
                                .getCurrentStore();

        return toResponse(
                target
        );
    }

    @PutMapping
    @Transactional
    public FulfillmentSettingsResponse update(
            @RequestBody FulfillmentSettingsRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Configuração de atendimento não informada."
            );
        }

        if (
                !request.deliveryEnabled() &&
                !request.pickupEnabled()
        ) {
            throw new IllegalArgumentException(
                    "Ative pelo menos entrega ou retirada."
            );
        }

        if (
                request.pickupEnabled() &&
                !request.pickupOnlinePaymentEnabled() &&
                !request.pickupPayAtStoreEnabled()
        ) {
            throw new IllegalArgumentException(
                    "A retirada precisa ter pelo menos uma forma de pagamento."
            );
        }

        if (
                request.pickupPayAtStoreEnabled() &&
                !request.pickupCashEnabled() &&
                !request.pickupCardEnabled() &&
                !request.pickupOtherEnabled()
        ) {
            throw new IllegalArgumentException(
                    "Selecione ao menos um método para pagamento na retirada."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        store.setDeliveryEnabled(
                request.deliveryEnabled()
        );
        store.setPickupEnabled(
                request.pickupEnabled()
        );
        store.setPickupOnlinePaymentEnabled(
                request.pickupOnlinePaymentEnabled()
        );
        store.setPickupPayAtStoreEnabled(
                request.pickupPayAtStoreEnabled()
        );
        store.setPickupCashEnabled(
                request.pickupCashEnabled()
        );
        store.setPickupCardEnabled(
                request.pickupCardEnabled()
        );
        store.setPickupOtherEnabled(
                request.pickupOtherEnabled()
        );
        store.setPickupInstructions(
                normalizeNullable(
                        request.pickupInstructions(),
                        500
                )
        );
        store.setPickupPreparationMinutes(
                normalizePreparationMinutes(
                        request.pickupPreparationMinutes()
                )
        );

        return toResponse(
                storeRepository
                        .saveAndFlush(
                                store
                        )
        );
    }

    private FulfillmentSettingsResponse toResponse(
            Store store
    ) {
        return new FulfillmentSettingsResponse(
                store.isDeliveryEnabled(),
                store.isPickupEnabled(),
                store.isPickupOnlinePaymentEnabled(),
                store.isPickupPayAtStoreEnabled(),
                store.isPickupCashEnabled(),
                store.isPickupCardEnabled(),
                store.isPickupOtherEnabled(),
                store.getPickupInstructions(),
                store.getPickupPreparationMinutes(),
                normalizeNullable(
                        store.getDeliveryOriginAddress(),
                        350
                ),
                store.getName(),
                store.getCountryCode(),
                store.getDefaultLocale(),
                store.getCurrencyCode()
        );
    }

    private Integer normalizePreparationMinutes(
            Integer value
    ) {
        if (value == null) {
            return 30;
        }

        if (
                value < 5 ||
                value > 240
        ) {
            throw new IllegalArgumentException(
                    "O tempo de preparo deve ficar entre 5 e 240 minutos."
            );
        }

        return value;
    }

    private String normalizeNullable(
            String value,
            int maxLength
    ) {
        if (value == null) {
            return null;
        }

        String normalized =
                value.trim();

        if (normalized.isBlank()) {
            return null;
        }

        if (
                normalized.length() >
                maxLength
        ) {
            throw new IllegalArgumentException(
                    "Texto acima do limite permitido."
            );
        }

        return normalized;
    }

    public record FulfillmentSettingsRequest(
            boolean deliveryEnabled,
            boolean pickupEnabled,
            boolean pickupOnlinePaymentEnabled,
            boolean pickupPayAtStoreEnabled,
            boolean pickupCashEnabled,
            boolean pickupCardEnabled,
            boolean pickupOtherEnabled,
            String pickupInstructions,
            Integer pickupPreparationMinutes
    ) {
    }

    public record FulfillmentSettingsResponse(
            boolean deliveryEnabled,
            boolean pickupEnabled,
            boolean pickupOnlinePaymentEnabled,
            boolean pickupPayAtStoreEnabled,
            boolean pickupCashEnabled,
            boolean pickupCardEnabled,
            boolean pickupOtherEnabled,
            String pickupInstructions,
            Integer pickupPreparationMinutes,
            String pickupAddress,
            String storeName,
            String countryCode,
            String defaultLocale,
            String currencyCode
    ) {
    }
}
