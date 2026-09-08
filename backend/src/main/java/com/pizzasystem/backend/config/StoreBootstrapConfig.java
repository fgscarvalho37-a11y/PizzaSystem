package com.pizzasystem.backend.config;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.entity.StoreSettings;

import com.pizzasystem.backend.repository.StoreRepository;
import com.pizzasystem.backend.repository.StoreSettingsRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.text.Normalizer;
import java.util.Locale;

@Configuration
public class StoreBootstrapConfig {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    StoreBootstrapConfig.class
            );

    @Bean
    @Order(1)
    public CommandLineRunner createInitialStore(
            StoreRepository storeRepository,
            StoreSettingsRepository storeSettingsRepository
    ) {

        return args -> {

            // =========================
            // JÁ EXISTE STORE
            // =========================

            if (storeRepository.count() > 0) {

                logger.info(
                        "Store já cadastrada. Bootstrap ignorado."
                );

                return;
            }

            // =========================
            // CONFIGURAÇÃO LEGADA
            // =========================

            StoreSettings settings =
                    storeSettingsRepository
                            .findById(
                                    1L
                            )
                            .orElse(
                                    null
                            );

            // =========================
            // CRIAR STORE
            // =========================

            Store store =
                    new Store();

            String storeName =
                    settings != null
                            && settings.getStoreName() != null
                            && !settings
                            .getStoreName()
                            .isBlank()
                            ? settings
                            .getStoreName()
                            .trim()
                            : "PizzaSystem";

            store.setName(
                    storeName
            );

            store.setSlug(
                    generateUniqueSlug(
                            storeName,
                            storeRepository
                    )
            );

            // =========================
            // MIGRAR CONFIGURAÇÃO ANTIGA
            // =========================

            if (settings != null) {

                store.setWhatsapp(
                        settings.getWhatsapp()
                );

                store.setOpen(
                        settings.isOpen()
                );

                store.setDailyOrderLimit(
                        settings.getDailyOrderLimit()
                );
            }

            // =========================
            // VALORES INICIAIS
            // =========================

            store.setHeadline(
                    "Pizza feita do nosso jeito, do forno até você."
            );

            store.setMarqueeMessage(
                    "Faça seu pedido online"
            );

            store.setMarqueeEnabled(
                    true
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
                    "STARTER"
            );

            store.setSubscriptionStatus(
                    "TRIAL"
            );

            Store savedStore =
                    storeRepository
                            .save(
                                    store
                            );

            logger.info(
                    "Primeira Store criada com sucesso. ID={}, slug={}",
                    savedStore.getId(),
                    savedStore.getSlug()
            );
        };
    }

    // =========================
    // GERAR SLUG
    // =========================

    private String generateUniqueSlug(
            String name,
            StoreRepository storeRepository
    ) {

        String baseSlug =
                normalizeSlug(
                        name
                );

        if (baseSlug.isBlank()) {

            baseSlug =
                    "pizzaria";
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

            slug =
                    baseSlug
                            + "-"
                            + suffix;

            suffix++;
        }

        return slug;
    }

    // =========================
    // NORMALIZAR SLUG
    // =========================

    private String normalizeSlug(
            String value
    ) {

        String normalized =
                Normalizer.normalize(
                        value,
                        Normalizer.Form.NFD
                );

        normalized =
                normalized.replaceAll(
                        "\\p{M}",
                        ""
                );

        return normalized
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
    }
}