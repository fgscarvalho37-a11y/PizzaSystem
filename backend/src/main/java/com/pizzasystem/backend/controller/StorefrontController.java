package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.StoreRepository;
import com.pizzasystem.backend.service.CurrentStoreService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/store/storefront")
public class StorefrontController {

    private static final Set<String> RESERVED_SLUGS =
            Set.of(
                    "admin",
                    "api",
                    "app",
                    "www",
                    "mail",
                    "cdn",
                    "suporte",
                    "support"
            );

    private final CurrentStoreService
            currentStoreService;

    private final StoreRepository
            storeRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${PIZZASYSTEM_STOREFRONT_BASE_DOMAIN:}")
    private String storefrontBaseDomain;

    public StorefrontController(
            CurrentStoreService currentStoreService,
            StoreRepository storeRepository
    ) {
        this.currentStoreService =
                currentStoreService;

        this.storeRepository =
                storeRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public StorefrontResponse get() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return toResponse(
                store
        );
    }

    @PutMapping
    @Transactional
    public StorefrontResponse updateSlug(
            @RequestBody StorefrontRequest request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Endereço da loja não informado."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        String slug =
                normalizeSlug(
                        request.slug()
                );

        Store existing =
                storeRepository
                        .findBySlug(
                                slug
                        )
                        .orElse(
                                null
                        );

        if (
                existing != null &&
                !existing
                        .getId()
                        .equals(
                                store.getId()
                        )
        ) {
            throw new IllegalArgumentException(
                    "Este endereço já está sendo usado por outra loja."
            );
        }

        store.setSlug(
                slug
        );

        store =
                storeRepository.save(
                        store
                );

        return toResponse(
                store
        );
    }

    private StorefrontResponse toResponse(
            Store store
    ) {

        String hostedDomain =
                normalizeBaseDomain(
                        storefrontBaseDomain
                );

        String publicUrl;

        if (!hostedDomain.isBlank()) {
            publicUrl =
                    "https://"
                            + store.getSlug()
                            + "."
                            + hostedDomain;
        } else {
            publicUrl =
                    normalizeFrontendUrl()
                            + "/cardapio/"
                            + store.getSlug();
        }

        return new StorefrontResponse(
                store.getSlug(),
                publicUrl,
                hostedDomain.isBlank()
                        ? null
                        : hostedDomain,
                !hostedDomain.isBlank()
        );
    }

    private String normalizeSlug(
            String value
    ) {

        if (
                value == null ||
                value.isBlank()
        ) {
            throw new IllegalArgumentException(
                    "Escolha um endereço para a loja."
            );
        }

        String normalized =
                Normalizer.normalize(
                        value,
                        Normalizer.Form.NFD
                )
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

        if (normalized.length() < 3) {
            throw new IllegalArgumentException(
                    "O endereço deve ter pelo menos 3 caracteres."
            );
        }

        if (RESERVED_SLUGS.contains(
                normalized
        )) {
            throw new IllegalArgumentException(
                    "Este endereço é reservado. Escolha outro."
            );
        }

        if (normalized.length() > 60) {
            throw new IllegalArgumentException(
                    "O endereço deve ter no máximo 60 caracteres."
            );
        }

        return normalized;
    }

    private String normalizeFrontendUrl() {

        String value =
                frontendUrl == null
                        ? ""
                        : frontendUrl.trim();

        while (value.endsWith("/")) {
            value =
                    value.substring(
                            0,
                            value.length() - 1
                    );
        }

        return value;
    }

    private String normalizeBaseDomain(
            String value
    ) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .toLowerCase(
                        Locale.ROOT
                )
                .replaceFirst(
                        "^https?://",
                        ""
                )
                .replaceAll(
                        "/+$",
                        ""
                );
    }

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    @ResponseStatus(
            HttpStatus.BAD_REQUEST
    )
    public Map<String, String> handleBadRequest(
            IllegalArgumentException exception
    ) {
        return Map.of(
                "message",
                exception.getMessage()
        );
    }

    public record StorefrontRequest(
            String slug
    ) {
    }

    public record StorefrontResponse(
            String slug,
            String publicUrl,
            String baseDomain,
            boolean hostedSubdomainEnabled
    ) {
    }
}
