package com.pizzasystem.backend.config;

import com.pizzasystem.backend.repository.AdminUserRepository;
import com.pizzasystem.backend.service.AdminAuthService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminBootstrapConfig {

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

                System.out.println(
                        "Administrador já cadastrado."
                );

                return;
            }

            // =========================
            // CREDENCIAIS NÃO CONFIGURADAS
            // =========================

            if (adminEmail == null
                    || adminEmail.isBlank()
                    || adminPassword == null
                    || adminPassword.isBlank()) {

                System.out.println(
                        "Nenhum administrador cadastrado."
                );

                System.out.println(
                        "Configure pizzasystem.admin.email e pizzasystem.admin.password para criar o primeiro administrador."
                );

                return;
            }

            // =========================
            // CRIAR PRIMEIRO ADMIN
            // =========================

            adminAuthService.createAdmin(
                    adminEmail,
                    adminPassword
            );

            System.out.println(
                    "Primeiro administrador criado com sucesso: "
                            + adminEmail
            );
        };
    }
}