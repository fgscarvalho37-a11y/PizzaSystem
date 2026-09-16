package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.StoreStatusResponse;
import com.pizzasystem.backend.entity.LoyaltyEarningType;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.StoreStatusService;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

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
        // HERO
        // =========================

        store.setHeroTitleLine1(
                cleanWithDefault(
                        data.heroTitleLine1(),
                        "ESCOLHA."
                )
        );

        store.setHeroTitleLine2(
                cleanWithDefault(
                        data.heroTitleLine2(),
                        "PEÇA."
                )
        );

        store.setHeroTitleLine3(
                cleanWithDefault(
                        data.heroTitleLine3(),
                        "APROVEITE."
                )
        );

        store.setHeroDescription(
                cleanWithDefault(
                        data.heroDescription(),
                        "Escolha seus favoritos, monte seu pedido e acompanhe tudo pelo site."
                )
        );

        store.setHeroPrimaryButtonText(
                cleanWithDefault(
                        data.heroPrimaryButtonText(),
                        "Ver cardápio"
                )
        );

        store.setHeroSecondaryButtonText(
                cleanWithDefault(
                        data.heroSecondaryButtonText(),
                        "Ver meu pedido"
                )
        );

        store.setHeroBadgeText(
                cleanWithDefault(
                        data.heroBadgeText(),
                        "CARDÁPIO ONLINE"
                )
        );

        store.setHeroOpenStatusText(
                cleanWithDefault(
                        data.heroOpenStatusText(),
                        "ABERTO"
                )
        );

        store.setHeroClosedStatusText(
                cleanWithDefault(
                        data.heroClosedStatusText(),
                        "FECHADO"
                )
        );

        // =========================
        // MENU
        // =========================

        store.setMenuTitle(
                cleanWithDefault(
                        data.menuTitle(),
                        "O cardápio"
                )
        );

        store.setMenuSubtitle(
                cleanWithDefault(
                        data.menuSubtitle(),
                        "Escolha o seu"
                )
        );

        store.setMenuSearchPlaceholder(
                cleanWithDefault(
                        data.menuSearchPlaceholder(),
                        "Buscar no cardápio"
                )
        );

        store.setMenuEmptyTitle(
                cleanWithDefault(
                        data.menuEmptyTitle(),
                        "Nenhum produto encontrado"
                )
        );

        store.setMenuEmptyDescription(
                cleanWithDefault(
                        data.menuEmptyDescription(),
                        "Tente buscar por outro termo ou escolha outra categoria."
                )
        );

        // =========================
        // FOOTER
        // =========================

        store.setFooterTagline(
                cleanWithDefault(
                        data.footerTagline(),
                        "Pedidos online"
                )
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

        store.setLoyaltyEarningType(
                normalizeLoyaltyEarningType(
                        data.loyaltyEarningType()
                )
        );

        store.setLoyaltyPointsPerOrder(
                normalizePositiveInteger(
                        data.loyaltyPointsPerOrder(),
                        1,
                        "A quantidade de selos por pedido"
                )
        );

        store.setLoyaltyAmountStep(
                normalizeAmountStep(
                        data.loyaltyAmountStep()
                )
        );

        store.setLoyaltyPointsPerAmountStep(
                normalizePositiveInteger(
                        data.loyaltyPointsPerAmountStep(),
                        1,
                        "A quantidade de selos por faixa de valor"
                )
        );

        store.setLoyaltyMinimumOrderValue(
                normalizeMinimumOrderValue(
                        data.loyaltyMinimumOrderValue()
                )
        );

        return toProfileResponse(
                store
        );
    }

    // =========================
    // ABRIR / FECHAR
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

                // Hero
                store.getHeroTitleLine1(),
                store.getHeroTitleLine2(),
                store.getHeroTitleLine3(),
                store.getHeroDescription(),
                store.getHeroPrimaryButtonText(),
                store.getHeroSecondaryButtonText(),
                store.getHeroBadgeText(),
                store.getHeroOpenStatusText(),
                store.getHeroClosedStatusText(),

                // Menu
                store.getMenuTitle(),
                store.getMenuSubtitle(),
                store.getMenuSearchPlaceholder(),
                store.getMenuEmptyTitle(),
                store.getMenuEmptyDescription(),

                // Footer
                store.getFooterTagline(),

                // Contato
                store.getWhatsapp(),
                store.getPhone(),
                store.getEmail(),

                // Fidelidade
                store.isLoyaltyEnabled(),
                store.getLoyaltyStampGoal(),
                store.getLoyaltyRewardDescription(),
                store.getLoyaltyEarningType(),
                store.getLoyaltyPointsPerOrder(),
                store.getLoyaltyAmountStep(),
                store.getLoyaltyPointsPerAmountStep(),
                store.getLoyaltyMinimumOrderValue()
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

    private String cleanWithDefault(
            String value,
            String defaultValue
    ) {

        String cleaned =
                cleanNullable(
                        value
                );

        return cleaned == null
                ? defaultValue
                : cleaned;
    }

    // =========================
    // LIMITE DIÁRIO
    // =========================

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

    private LoyaltyEarningType
    normalizeLoyaltyEarningType(
            LoyaltyEarningType value
    ) {

        if (value == null) {

            return LoyaltyEarningType.PER_ORDER;
        }

        return value;
    }

    private Integer normalizePositiveInteger(
            Integer value,
            Integer defaultValue,
            String field
    ) {

        if (value == null) {

            return defaultValue;
        }

        if (value < 1) {

            throw new IllegalArgumentException(
                    field
                            + " deve ser maior ou igual a 1."
            );
        }

        return value;
    }

    private BigDecimal normalizeAmountStep(
            BigDecimal value
    ) {

        if (value == null) {

            return BigDecimal.valueOf(
                    20
            );
        }

        if (value.compareTo(
                BigDecimal.ZERO
        ) <= 0) {

            throw new IllegalArgumentException(
                    "O valor da faixa de fidelidade deve ser maior que zero."
            );
        }

        return value;
    }

    private BigDecimal normalizeMinimumOrderValue(
            BigDecimal value
    ) {

        if (value == null) {

            return null;
        }

        if (value.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            throw new IllegalArgumentException(
                    "O valor mínimo do pedido não pode ser negativo."
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

            // Hero
            String heroTitleLine1,
            String heroTitleLine2,
            String heroTitleLine3,
            String heroDescription,
            String heroPrimaryButtonText,
            String heroSecondaryButtonText,
            String heroBadgeText,
            String heroOpenStatusText,
            String heroClosedStatusText,

            // Menu
            String menuTitle,
            String menuSubtitle,
            String menuSearchPlaceholder,
            String menuEmptyTitle,
            String menuEmptyDescription,

            // Footer
            String footerTagline,

            // Contato
            String whatsapp,
            String phone,
            String email,

            // Fidelidade
            boolean loyaltyEnabled,
            Integer loyaltyStampGoal,
            String loyaltyRewardDescription,
            LoyaltyEarningType loyaltyEarningType,
            Integer loyaltyPointsPerOrder,
            BigDecimal loyaltyAmountStep,
            Integer loyaltyPointsPerAmountStep,
            BigDecimal loyaltyMinimumOrderValue
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

            // Hero
            String heroTitleLine1,
            String heroTitleLine2,
            String heroTitleLine3,
            String heroDescription,
            String heroPrimaryButtonText,
            String heroSecondaryButtonText,
            String heroBadgeText,
            String heroOpenStatusText,
            String heroClosedStatusText,

            // Menu
            String menuTitle,
            String menuSubtitle,
            String menuSearchPlaceholder,
            String menuEmptyTitle,
            String menuEmptyDescription,

            // Footer
            String footerTagline,

            // Contato
            String whatsapp,
            String phone,
            String email,

            // Fidelidade
            boolean loyaltyEnabled,
            Integer loyaltyStampGoal,
            String loyaltyRewardDescription,
            LoyaltyEarningType loyaltyEarningType,
            Integer loyaltyPointsPerOrder,
            BigDecimal loyaltyAmountStep,
            Integer loyaltyPointsPerAmountStep,
            BigDecimal loyaltyMinimumOrderValue
    ) {
    }
}