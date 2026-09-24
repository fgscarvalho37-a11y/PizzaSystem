package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.AdminUserRepository;
import com.pizzasystem.backend.repository.StoreRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Objects;

@Service
public class OrbittaProvisionService {

    private final StoreRepository storeRepository;
    private final AdminUserRepository adminUserRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${pizzasystem.storefront-base-domain:}")
    private String storefrontBaseDomain;

    public OrbittaProvisionService(
            StoreRepository storeRepository,
            AdminUserRepository adminUserRepository
    ) {
        this.storeRepository =
                storeRepository;

        this.adminUserRepository =
                adminUserRepository;
    }

    @Transactional
    public ProvisionResult provision(
            Long orbittaUserId,
            Long orbittaProductId,
            String email,
            String name,
            String planName,
            String passwordHash
    ) {

        validateIds(
                orbittaUserId,
                orbittaProductId
        );

        String normalizedEmail =
                normalizeEmail(
                        email
                );

        String normalizedName =
                normalizeName(
                        name
                );

        String normalizedPlan =
                normalizePlan(
                        planName
                );

        validatePasswordHash(
                passwordHash
        );

        Store store =
                storeRepository
                        .findByOrbittaProductId(
                                orbittaProductId
                        )
                        .orElse(
                                null
                        );

        AdminUser admin =
                adminUserRepository
                        .findByEmailIgnoreCase(
                                normalizedEmail
                        )
                        .orElse(
                                null
                        );

        if (store != null) {

            if (
                    !Objects.equals(
                            store.getOrbittaUserId(),
                            orbittaUserId
                    )
            ) {
                throw new IllegalStateException(
                        "Produto Orbitta já vinculado a outro cliente."
                );
            }

            store.setActive(
                    true
            );

            store.setSubscriptionStatus(
                    "ACTIVE"
            );

            store.setPlan(
                    normalizedPlan
            );

            store =
                    storeRepository.save(
                            store
                    );

            admin =
                    ensureAdmin(
                            admin,
                            normalizedEmail,
                            passwordHash,
                            store
                    );

            return buildResult(
                    store,
                    admin
            );
        }

        if (
                admin != null &&
                admin.getStore() != null
        ) {

            Store existingStore =
                    admin.getStore();

            Long existingOrbittaProductId =
                    existingStore
                            .getOrbittaProductId();

            if (
                    existingOrbittaProductId != null &&
                    !Objects.equals(
                            existingOrbittaProductId,
                            orbittaProductId
                    )
            ) {
                throw new IllegalStateException(
                        "Este administrador já está vinculado a outro produto PizzaSystem."
                );
            }

            existingStore.setOrbittaUserId(
                    orbittaUserId
            );

            existingStore.setOrbittaProductId(
                    orbittaProductId
            );

            existingStore.setActive(
                    true
            );

            existingStore.setSubscriptionStatus(
                    "ACTIVE"
            );

            existingStore.setPlan(
                    normalizedPlan
            );

            store =
                    storeRepository.save(
                            existingStore
                    );

            admin.setPasswordHash(
                    passwordHash
            );

            admin.setActive(
                    true
            );

            admin =
                    adminUserRepository.save(
                            admin
                    );

            return buildResult(
                    store,
                    admin
            );
        }

        store =
                new Store();

        store.setName(
                normalizedName
        );

        store.setSlug(
                generateUniqueSlug(
                        normalizedName
                )
        );

        store.setOrbittaUserId(
                orbittaUserId
        );

        store.setOrbittaProductId(
                orbittaProductId
        );

        store.setEmail(
                normalizedEmail
        );

        store.setHeadline(
                "Peça online de forma rápida e fácil."
        );

        store.setMarqueeMessage(
                "Faça seu pedido online"
        );

        store.setMarqueeEnabled(
                true
        );

        store.setOpen(
                false
        );

        store.setDailyOrderLimit(
                30
        );

        store.setLoyaltyEnabled(
                false
        );

        store.setLoyaltyStampGoal(
                10
        );

        store.setActive(
                true
        );

        store.setPlan(
                normalizedPlan
        );

        store.setSubscriptionStatus(
                "ACTIVE"
        );

        store =
                storeRepository.save(
                        store
                );

        admin =
                ensureAdmin(
                        admin,
                        normalizedEmail,
                        passwordHash,
                        store
                );

        return buildResult(
                store,
                admin
        );
    }

    @Transactional
    public LifecycleResult suspend(
            Long orbittaProductId
    ) {

        Store store =
                getStoreByOrbittaProductId(
                        orbittaProductId
                );

        store.setActive(
                false
        );

        store.setSubscriptionStatus(
                "SUSPENDED"
        );

        store =
                storeRepository.save(
                        store
                );

        for (
                AdminUser admin :
                adminUserRepository
                        .findAllByStoreId(
                                store.getId()
                        )
        ) {
            admin.setActive(
                    false
            );

            adminUserRepository.save(
                    admin
            );
        }

        return new LifecycleResult(
                store.getId(),
                store.getOrbittaProductId(),
                store.isActive(),
                store.getSubscriptionStatus()
        );
    }

    @Transactional
    public LifecycleResult reactivate(
            Long orbittaProductId
    ) {

        Store store =
                getStoreByOrbittaProductId(
                        orbittaProductId
                );

        store.setActive(
                true
        );

        store.setSubscriptionStatus(
                "ACTIVE"
        );

        store =
                storeRepository.save(
                        store
                );

        for (
                AdminUser admin :
                adminUserRepository
                        .findAllByStoreId(
                                store.getId()
                        )
        ) {
            admin.setActive(
                    true
            );

            adminUserRepository.save(
                    admin
            );
        }

        return new LifecycleResult(
                store.getId(),
                store.getOrbittaProductId(),
                store.isActive(),
                store.getSubscriptionStatus()
        );
    }

    private Store getStoreByOrbittaProductId(
            Long orbittaProductId
    ) {

        if (
                orbittaProductId == null ||
                orbittaProductId <= 0
        ) {
            throw new IllegalArgumentException(
                    "orbittaProductId inválido."
            );
        }

        return storeRepository
                .findByOrbittaProductId(
                        orbittaProductId
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Loja vinculada ao produto Orbitta não encontrada."
                        )
                );
    }

    private AdminUser ensureAdmin(
            AdminUser admin,
            String email,
            String passwordHash,
            Store store
    ) {

        if (admin == null) {

            admin =
                    new AdminUser();

            admin.setEmail(
                    email
            );
        }

        if (
                admin.getStore() != null &&
                !Objects.equals(
                        admin.getStore().getId(),
                        store.getId()
                )
        ) {
            throw new IllegalStateException(
                    "Administrador já vinculado a outra loja."
            );
        }

        admin.setPasswordHash(
                passwordHash
        );

        admin.setActive(
                true
        );

        admin.setStore(
                store
        );

        return adminUserRepository
                .save(
                        admin
                );
    }

    private ProvisionResult buildResult(
            Store store,
            AdminUser admin
    ) {

        String baseUrl =
                frontendUrl == null
                        ? ""
                        : frontendUrl.trim();

        while (
                baseUrl.endsWith("/")
        ) {
            baseUrl =
                    baseUrl.substring(
                            0,
                            baseUrl.length() - 1
                    );
        }

        return new ProvisionResult(
                store.getId(),
                store.getSlug(),
                admin.getId(),
                baseUrl + "/admin/login",
                buildStorefrontUrl(
                        store,
                        baseUrl
                )
        );
    }

    private String buildStorefrontUrl(
            Store store,
            String frontendBaseUrl
    ) {

        String domain =
                storefrontBaseDomain == null
                        ? ""
                        : storefrontBaseDomain
                                .trim()
                                .toLowerCase(
                                        Locale.ROOT
                                );

        domain =
                domain
                        .replaceFirst(
                                "^https?://",
                                ""
                        )
                        .replaceAll(
                                "/+$",
                                ""
                        );

        if (!domain.isBlank()) {
            return "https://"
                    + store.getSlug()
                    + "."
                    + domain;
        }

        return frontendBaseUrl
                + "/cardapio/"
                + store.getSlug();
    }

    private void validateIds(
            Long orbittaUserId,
            Long orbittaProductId
    ) {

        if (
                orbittaUserId == null ||
                orbittaUserId <= 0
        ) {
            throw new IllegalArgumentException(
                    "orbittaUserId inválido."
            );
        }

        if (
                orbittaProductId == null ||
                orbittaProductId <= 0
        ) {
            throw new IllegalArgumentException(
                    "orbittaProductId inválido."
            );
        }
    }

    private String normalizeEmail(
            String email
    ) {

        if (
                email == null ||
                email.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "E-mail é obrigatório."
            );
        }

        String normalized =
                email
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (!normalized.contains("@")) {
            throw new IllegalArgumentException(
                    "E-mail inválido."
            );
        }

        return normalized;
    }

    private String normalizeName(
            String name
    ) {

        String normalized =
                name == null
                        ? ""
                        : name.trim();

        if (normalized.isBlank()) {
            normalized =
                    "Minha Loja";
        }

        if (normalized.length() > 120) {
            normalized =
                    normalized.substring(
                            0,
                            120
                    );
        }

        return normalized;
    }

    private String normalizePlan(
            String planName
    ) {

        String normalized =
                planName == null
                        ? ""
                        : planName.trim();

        if (normalized.isBlank()) {
            return "STARTER";
        }

        return normalized;
    }

    private void validatePasswordHash(
            String passwordHash
    ) {

        if (
                passwordHash == null ||
                passwordHash.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Hash de senha é obrigatório."
            );
        }

        String value =
                passwordHash.trim();

        boolean bcrypt =
                value.startsWith("$2a$") ||
                value.startsWith("$2b$") ||
                value.startsWith("$2y$");

        if (
                !bcrypt ||
                value.length() < 50 ||
                value.length() > 100
        ) {
            throw new IllegalArgumentException(
                    "Hash de senha inválido."
            );
        }
    }

    private String generateUniqueSlug(
            String name
    ) {

        String normalized =
                Normalizer.normalize(
                        name,
                        Normalizer.Form.NFD
                );

        String baseSlug =
                normalized
                        .replaceAll(
                                "\\p{M}",
                                ""
                        )
                        .toLowerCase(
                                Locale.ROOT
                        )
                        .replaceAll(
                                "[^a-z0-9]+",
                                "-"
                        )
                        .replaceAll(
                                "^-+|-+$",
                                ""
                        );

        if (baseSlug.isBlank()) {
            baseSlug =
                    "loja";
        }

        if (baseSlug.length() > 70) {
            baseSlug =
                    baseSlug.substring(
                            0,
                            70
                    );
        }

        String slug =
                baseSlug;

        int suffix =
                2;

        while (
                storeRepository
                        .existsBySlug(
                                slug
                        )
        ) {

            String suffixText =
                    "-" + suffix;

            int maxBaseLength =
                    80 -
                    suffixText.length();

            String safeBase =
                    baseSlug.length() >
                            maxBaseLength
                            ? baseSlug.substring(
                                    0,
                                    maxBaseLength
                            )
                            : baseSlug;

            slug =
                    safeBase +
                    suffixText;

            suffix++;
        }

        return slug;
    }

    public record ProvisionResult(
            Long tenantId,
            String slug,
            Long adminUserId,
            String systemUrl,
            String storefrontUrl
    ) {
    }

    public record LifecycleResult(
            Long tenantId,
            Long orbittaProductId,
            boolean active,
            String subscriptionStatus
    ) {
    }
}
