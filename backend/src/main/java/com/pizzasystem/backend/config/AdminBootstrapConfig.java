package com.pizzasystem.backend.config;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.AdminUserRepository;
import com.pizzasystem.backend.repository.StoreRepository;

import com.pizzasystem.backend.service.AdminAuthService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
@ConditionalOnProperty(
        name = "pizzasystem.legacy-bootstrap.enabled",
        havingValue = "true"
)
public class AdminBootstrapConfig {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    AdminBootstrapConfig.class
            );

    private static final int MIN_PASSWORD_LENGTH =
            12;

    @Bean
    @Order(2)
    public CommandLineRunner createInitialAdmin(
            AdminUserRepository adminUserRepository,
            StoreRepository storeRepository,
            AdminAuthService adminAuthService,

            @Value("${pizzasystem.admin.email:}")
            String adminEmail,

            @Value("${pizzasystem.admin.password:}")
            String adminPassword
    ) {

        return args -> {

            // =========================
            // JÁ EXISTE ADMIN
            // =========================

            if (adminUserRepository.count() > 0) {

                logger.info(
                        "Administrador já cadastrado. Bootstrap ignorado."
                );

                return;
            }

            // =========================
            // STORE INICIAL
            // =========================

            Store store =
                    storeRepository
                            .findFirstByOrderByIdAsc()
                            .orElseThrow(() ->
                                    new IllegalStateException(
                                            "Não existe Store cadastrada para vincular o administrador."
                                    )
                            );

            // =========================
            // NORMALIZAR CREDENCIAIS
            // =========================

            String normalizedEmail =
                    adminEmail != null
                            ? adminEmail
                            .trim()
                            .toLowerCase()
                            : "";

            String password =
                    adminPassword != null
                            ? adminPassword
                            : "";

            // =========================
            // CREDENCIAIS AUSENTES
            // =========================

            if (normalizedEmail.isBlank()
                    || password.isBlank()) {

                logger.warn(
                        "Nenhum administrador cadastrado. " +
                        "Configure PIZZASYSTEM_ADMIN_EMAIL e " +
                        "PIZZASYSTEM_ADMIN_PASSWORD para criar " +
                        "o primeiro administrador."
                );

                return;
            }

            // =========================
            // VALIDAÇÃO
            // =========================

            if (!normalizedEmail.contains(
                    "@"
            )) {

                throw new IllegalStateException(
                        "PIZZASYSTEM_ADMIN_EMAIL inválido."
                );
            }

            if (password.length()
                    < MIN_PASSWORD_LENGTH) {

                throw new IllegalStateException(
                        "PIZZASYSTEM_ADMIN_PASSWORD deve ter pelo menos "
                                + MIN_PASSWORD_LENGTH
                                + " caracteres."
                );
            }

            // =========================
            // CRIAR ADMIN
            // =========================

            AdminUser admin =
                    adminAuthService
                            .createAdmin(
                                    normalizedEmail,
                                    password
                            );

            // =========================
            // VINCULAR À STORE
            // =========================

            admin.setStore(
                    store
            );

            adminUserRepository.save(
                    admin
            );

            logger.info(
                    "Primeiro administrador criado e vinculado à Store ID={}.",
                    store.getId()
            );
        };
    }
}