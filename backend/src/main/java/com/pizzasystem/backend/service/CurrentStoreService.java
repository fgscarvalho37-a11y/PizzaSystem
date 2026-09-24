package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.AdminUser;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.AdminUserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentStoreService {

    private final AdminUserRepository
            adminUserRepository;

    public CurrentStoreService(
            AdminUserRepository adminUserRepository
    ) {
        this.adminUserRepository =
                adminUserRepository;
    }

    // =========================
    // STORE DO ADMIN LOGADO
    // =========================

    @Transactional(readOnly = true)
    public Store getCurrentStore() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new IllegalStateException(
                    "Administrador não autenticado."
            );
        }

        String email =
                authentication.getName();

        if (email == null
                || email.isBlank()
                || "anonymousUser".equalsIgnoreCase(email)) {

            throw new IllegalStateException(
                    "Administrador não autenticado."
            );
        }

        AdminUser admin =
                adminUserRepository
                        .findByEmailIgnoreCase(
                                email.trim()
                        )
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Administrador não encontrado."
                                )
                        );

        if (!admin.isActive()) {

            throw new IllegalStateException(
                    "Administrador inativo."
            );
        }

        Store store =
                admin.getStore();

        if (store == null) {

            throw new IllegalStateException(
                    "Administrador não possui loja vinculada."
            );
        }

        if (!store.isActive()) {

            throw new IllegalStateException(
                    "Loja suspensa ou indisponível."
            );
        }

        return store;
    }

    // =========================
    // ID DA STORE
    // =========================

    @Transactional(readOnly = true)
    public Long getCurrentStoreId() {

        return getCurrentStore()
                .getId();
    }
}