package com.pizzasystem.backend.config;

import com.pizzasystem.backend.repository.AdminUserRepository;
import com.pizzasystem.backend.service.AdminAuthService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminBootstrapConfig {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    AdminBootstrapConfig.class
            );

    private static final int MIN_PASSWORD_LENGTH =
            12;

    @Bean
    public CommandLineRunner createInitialAdmin(
            AdminUserRepository adminUserRepository,
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
            // NORMALIZAR CREDENCIAIS
            // =========================

            String normalizedEmail =
                    adminEmail != null
                            ? adminEmail.trim().toLowerCase()
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
            // VALIDAÇÃO BÁSICA
            // =========================

            if (!normalizedEmail.contains("@")) {

                throw new IllegalStateException(
                        "PIZZASYSTEM_ADMIN_EMAIL inválido."
                );
            }

            if (password.length() < MIN_PASSWORD_LENGTH) {

                throw new IllegalStateException(
                        "PIZZASYSTEM_ADMIN_PASSWORD deve ter " +
                        "pelo menos " +
                        MIN_PASSWORD_LENGTH +
                        " caracteres."
                );
            }

            // =========================
            // CRIAR PRIMEIRO ADMIN
            // =========================

            adminAuthService.createAdmin(
                    normalizedEmail,
                    password
            );

            logger.info(
                    "Primeiro administrador criado com sucesso."
            );
        };
    }
}