package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.repository.AdminUserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AdminAuthService {

    private static final int MIN_PASSWORD_LENGTH = 12;

    private static final String INVALID_CREDENTIALS_MESSAGE =
            "E-mail ou senha inválidos";

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
    // NORMALIZAR E-MAIL
    // =========================

    private String normalizeEmail(
            String email
    ) {

        if (email == null) {
            return "";
        }

        return email
                .trim()
                .toLowerCase(
                        Locale.ROOT
                );
    }

    // =========================
    // BUSCAR POR E-MAIL
    // =========================

    @Transactional(readOnly = true)
    public AdminUser findByEmail(
            String email
    ) {

        String normalizedEmail =
                normalizeEmail(
                        email
                );

        if (normalizedEmail.isBlank()) {

            throw new IllegalArgumentException(
                    "E-mail não informado"
            );
        }

        return adminUserRepository
                .findByEmailIgnoreCase(
                        normalizedEmail
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Administrador não encontrado"
                        )
                );
    }

    // =========================
    // AUTENTICAR
    // =========================

    @Transactional(readOnly = true)
    public AdminUser authenticate(
            String email,
            String password
    ) {

        String normalizedEmail =
                normalizeEmail(
                        email
                );

        /*
         * Para autenticação pública, não diferenciamos
         * e-mail ausente, usuário inexistente, conta
         * inativa ou senha incorreta.
         */
        if (normalizedEmail.isBlank()
                || password == null
                || password.isBlank()) {

            throw new IllegalArgumentException(
                    INVALID_CREDENTIALS_MESSAGE
            );
        }

        AdminUser user =
                adminUserRepository
                        .findByEmailIgnoreCase(
                                normalizedEmail
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        INVALID_CREDENTIALS_MESSAGE
                                )
                        );

        if (!user.isActive()) {

            throw new IllegalArgumentException(
                    INVALID_CREDENTIALS_MESSAGE
            );
        }

        boolean passwordMatches =
                passwordEncoder.matches(
                        password,
                        user.getPasswordHash()
                );

        if (!passwordMatches) {

            throw new IllegalArgumentException(
                    INVALID_CREDENTIALS_MESSAGE
            );
        }

        return user;
    }

    // =========================
    // CONCLUIR ONBOARDING
    // =========================

    @Transactional
    public AdminUser completeOnboarding(
            String email
    ) {

        AdminUser user =
                findByEmail(
                        email
                );

        if (!user.isOnboardingCompleted()) {
            user.setOnboardingCompleted(
                    true
            );

            user =
                    adminUserRepository.save(
                            user
                    );
        }

        return user;
    }

    // =========================
    // CRIAR ADMIN
    // =========================

    @Transactional
    public AdminUser createAdmin(
            String email,
            String password
    ) {

        String normalizedEmail =
                normalizeEmail(
                        email
                );

        if (normalizedEmail.isBlank()) {

            throw new IllegalArgumentException(
                    "E-mail não informado"
            );
        }

        if (!normalizedEmail.contains("@")) {

            throw new IllegalArgumentException(
                    "E-mail inválido"
            );
        }

        if (password == null
                || password.length()
                < MIN_PASSWORD_LENGTH) {

            throw new IllegalArgumentException(
                    "A senha deve ter pelo menos "
                            + MIN_PASSWORD_LENGTH
                            + " caracteres"
            );
        }

        if (adminUserRepository
                .existsByEmailIgnoreCase(
                        normalizedEmail
                )) {

            throw new IllegalStateException(
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