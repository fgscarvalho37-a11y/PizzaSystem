package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.repository.AdminUserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthService {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.adminUserRepository =
                adminUserRepository;

        this.passwordEncoder =
                passwordEncoder;
    }

    // =========================
    // BUSCAR POR E-MAIL
    // =========================

    public AdminUser findByEmail(
            String email
    ) {

        if (email == null
                || email.isBlank()) {

            throw new RuntimeException(
                    "E-mail não informado"
            );
        }

        return adminUserRepository
                .findByEmailIgnoreCase(
                        email.trim()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Usuário administrativo não encontrado"
                        )
                );
    }

    // =========================
    // AUTENTICAR
    // =========================

    public AdminUser authenticate(
            String email,
            String password
    ) {

        if (email == null
                || email.isBlank()) {

            throw new RuntimeException(
                    "E-mail não informado"
            );
        }

        if (password == null
                || password.isBlank()) {

            throw new RuntimeException(
                    "Senha não informada"
            );
        }

        AdminUser user =
                adminUserRepository
                        .findByEmailIgnoreCase(
                                email.trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "E-mail ou senha inválidos"
                                )
                        );

        if (!user.isActive()) {

            throw new RuntimeException(
                    "Usuário administrativo inativo"
            );
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        password,
                        user.getPasswordHash()
                );

        if (!passwordMatches) {

            throw new RuntimeException(
                    "E-mail ou senha inválidos"
            );
        }

        return user;
    }

    // =========================
    // CRIAR PRIMEIRO ADMIN
    // =========================

    @Transactional
    public AdminUser createAdmin(
            String email,
            String password
    ) {

        if (email == null
                || email.isBlank()) {

            throw new RuntimeException(
                    "E-mail não informado"
            );
        }

        if (password == null
                || password.length() < 8) {

            throw new RuntimeException(
                    "A senha deve ter pelo menos 8 caracteres"
            );
        }

        String normalizedEmail =
                email
                        .trim()
                        .toLowerCase();

        if (adminUserRepository
                .existsByEmailIgnoreCase(
                        normalizedEmail
                )) {

            throw new RuntimeException(
                    "Já existe um administrador com este e-mail"
            );
        }

        AdminUser user =
                new AdminUser();

        user.setEmail(
                normalizedEmail
        );

        user.setPasswordHash(
                passwordEncoder.encode(
                        password
                )
        );

        user.setActive(
                true
        );

        return adminUserRepository
                .save(
                        user
                );
    }
}