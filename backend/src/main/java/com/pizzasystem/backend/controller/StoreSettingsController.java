package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.StoreStatusResponse;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.StoreStatusService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store")
public class StoreSettingsController {

    private final CurrentStoreService
            currentStoreService;

    private final StoreStatusService
            storeStatusService;

    public StoreSettingsController(
            CurrentStoreService currentStoreService,
            StoreStatusService storeStatusService
    ) {

        this.currentStoreService =
                currentStoreService;

        this.storeStatusService =
                storeStatusService;
    }

    // =========================
    // CONFIGURAÇÕES OPERACIONAIS
    // ADMIN
    // =========================

    /*
     * Mantém o mesmo formato que o
     * frontend antigo já espera.
     *
     * A diferença é que agora os dados
     * vêm diretamente da Store do admin.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public StoreSettingsResponse getSettings() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return toSettingsResponse(
                store
        );
    }

    // =========================
    // STATUS DA LOJA
    // =========================

    /*
     * PÚBLICO:
     *
     * GET /api/store/status
     * ?store=misterio-do-sabor
     *
     *
     * ADMIN:
     *
     * GET /api/store/status
     *
     * Quando não existe slug, usamos
     * a Store do administrador logado.
     */
    @GetMapping("/status")
    @Transactional(readOnly = true)
    public StoreStatusResponse getStatus(
            @RequestParam(
                    required = false
            )
            String store
    ) {

        if (store != null
                && !store.isBlank()) {

            return storeStatusService
                    .getStatus(
                            store.trim()
                    );
        }

        Store currentStore =
                currentStoreService
                        .getCurrentStore();

        return storeStatusService
                .getStatus(
                        currentStore
                );
    }

    // =========================
    // PERFIL DA LOJA
    // ADMIN
    // =========================

    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public StoreProfileResponse getProfile() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return toProfileResponse(
                store
        );
    }

    // =========================
    // ATUALIZAR OPERAÇÃO
    // ADMIN
    // =========================

    @PutMapping
    @Transactional
    public StoreSettingsResponse update(
            @RequestBody StoreSettingsRequest data
    ) {

        if (data == null) {

            throw new IllegalArgumentException(
                    "Dados da loja não informados."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        store.setName(
                cleanRequired(
                        data.storeName(),
                        "Nome da pizzaria"
                )
        );

        store.setWhatsapp(
                cleanNullable(
                        data.whatsapp()
                )
        );

        store.setOpen(
                data.open()
        );

        store.setDailyOrderLimit(
                normalizeDailyLimit(
                        data.dailyOrderLimit()
                )
        );

        /*
         * Não recebemos storeId.
         *
         * A entidade Store já está gerenciada
         * pelo JPA dentro da transação.
         */

        return toSettingsResponse(
                store
        );
    }

    // =========================
    // PERSONALIZAÇÃO
    // ADMIN
    // =========================

    @PutMapping("/profile")
    @Transactional
    public StoreProfileResponse updateProfile(
            @RequestBody StoreProfileRequest data
    ) {

        if (data == null) {

            throw new IllegalArgumentException(
                    "Dados do perfil não informados."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        // =========================
        // IDENTIDADE
        // =========================

        store.setName(
                cleanRequired(
                        data.name(),
                        "Nome da pizzaria"
                )
        );

        store.setLogoUrl(
                cleanNullable(
                        data.logoUrl()
                )
        );

        store.setCoverImageUrl(
                cleanNullable(
                        data.coverImageUrl()
                )
        );

        // =========================
        // CORES
        // =========================

        store.setPrimaryColor(
                normalizeColor(
                        data.primaryColor()
                )
        );

        store.setSecondaryColor(
                normalizeColor(
                        data.secondaryColor()
                )
        );

        // =========================
        // CARDÁPIO
        // =========================

        store.setHeadline(
                cleanNullable(
                        data.headline()
                )
        );

        store.setMarqueeMessage(
                cleanNullable(
                        data.marqueeMessage()
                )
        );

        store.setMarqueeEnabled(
                data.marqueeEnabled()
        );

        // =========================
        // CONTATO
        // =========================

        store.setWhatsapp(
                cleanNullable(
                        data.whatsapp()
                )
        );

        store.setPhone(
                cleanNullable(
                        data.phone()
                )
        );

        store.setEmail(
                cleanNullable(
                        data.email()
                )
        );

        // =========================
        // FIDELIDADE
        // =========================

        store.setLoyaltyEnabled(
                data.loyaltyEnabled()
        );

        store.setLoyaltyStampGoal(
                normalizeStampGoal(
                        data.loyaltyStampGoal()
                )
        );

        store.setLoyaltyRewardDescription(
                cleanNullable(
                        data.loyaltyRewardDescription()
                )
        );

        return toProfileResponse(
                store
        );
    }

    // =========================
    // ABRIR / FECHAR
    // ADMIN
    // =========================

    @PatchMapping("/open")
    @Transactional
    public StoreSettingsResponse changeOpen(
            @RequestParam boolean open
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        store.setOpen(
                open
        );

        return toSettingsResponse(
                store
        );
    }

    // =========================
    // STORE -> SETTINGS RESPONSE
    // =========================

    private StoreSettingsResponse
    toSettingsResponse(
            Store store
    ) {

        return new StoreSettingsResponse(
                store.getId(),
                store.getName(),
                store.isOpen(),
                store.getWhatsapp(),
                store.getDailyOrderLimit()
        );
    }

    // =========================
    // STORE -> PROFILE RESPONSE
    // =========================

    private StoreProfileResponse
    toProfileResponse(
            Store store
    ) {

        return new StoreProfileResponse(
                store.getId(),
                store.getName(),
                store.getSlug(),
                store.getLogoUrl(),
                store.getCoverImageUrl(),
                store.getPrimaryColor(),
                store.getSecondaryColor(),
                store.getHeadline(),
                store.getMarqueeMessage(),
                store.isMarqueeEnabled(),
                store.getWhatsapp(),
                store.getPhone(),
                store.getEmail(),
                store.isLoyaltyEnabled(),
                store.getLoyaltyStampGoal(),
                store.getLoyaltyRewardDescription()
        );
    }

    // =========================
    // VALIDAÇÕES
    // =========================

    private String cleanRequired(
            String value,
            String field
    ) {

        if (value == null
                || value.isBlank()) {

            throw new IllegalArgumentException(
                    field
                            + " não pode ficar vazio."
            );
        }

        return value.trim();
    }

    private String cleanNullable(
            String value
    ) {

        if (value == null) {

            return null;
        }

        String cleaned =
                value.trim();

        return cleaned.isBlank()
                ? null
                : cleaned;
    }

    // =========================
    // LIMITE DIÁRIO
    // =========================

    /*
     * 0 = sem limite.
     *
     * Isso agora bate com o que
     * o frontend informa ao usuário.
     */
    private Integer normalizeDailyLimit(
            Integer value
    ) {

        if (value == null) {

            return 30;
        }

        if (value < 0) {

            throw new IllegalArgumentException(
                    "O limite diário não pode ser negativo."
            );
        }

        return value;
    }

    // =========================
    // FIDELIDADE
    // =========================

    private Integer normalizeStampGoal(
            Integer value
    ) {

        if (value == null
                || value < 2) {

            return 10;
        }

        if (value > 100) {

            throw new IllegalArgumentException(
                    "A meta de fidelidade não pode ultrapassar 100 selos."
            );
        }

        return value;
    }

    // =========================
    // CORES
    // =========================

    private String normalizeColor(
            String value
    ) {

        String color =
                cleanNullable(
                        value
                );

        if (color == null) {

            return null;
        }

        if (!color.matches(
                "^#[0-9a-fA-F]{6}$"
        )) {

            throw new IllegalArgumentException(
                    "A cor deve estar no formato hexadecimal, por exemplo #E63946."
            );
        }

        return color.toUpperCase();
    }

    // =========================
    // DTO - OPERAÇÃO REQUEST
    // =========================

    public record StoreSettingsRequest(
            Long id,
            String storeName,
            boolean open,
            String whatsapp,
            Integer dailyOrderLimit
    ) {
    }

    // =========================
    // DTO - OPERAÇÃO RESPONSE
    // =========================

    public record StoreSettingsResponse(
            Long id,
            String storeName,
            boolean open,
            String whatsapp,
            Integer dailyOrderLimit
    ) {
    }

    // =========================
    // DTO - PERFIL REQUEST
    // =========================

    public record StoreProfileRequest(
            String name,
            String logoUrl,
            String coverImageUrl,
            String primaryColor,
            String secondaryColor,
            String headline,
            String marqueeMessage,
            boolean marqueeEnabled,
            String whatsapp,
            String phone,
            String email,
            boolean loyaltyEnabled,
            Integer loyaltyStampGoal,
            String loyaltyRewardDescription
    ) {
    }

    // =========================
    // DTO - PERFIL RESPONSE
    // =========================

    public record StoreProfileResponse(
            Long id,
            String name,
            String slug,
            String logoUrl,
            String coverImageUrl,
            String primaryColor,
            String secondaryColor,
            String headline,
            String marqueeMessage,
            boolean marqueeEnabled,
            String whatsapp,
            String phone,
            String email,
            boolean loyaltyEnabled,
            Integer loyaltyStampGoal,
            String loyaltyRewardDescription
    ) {
    }
}