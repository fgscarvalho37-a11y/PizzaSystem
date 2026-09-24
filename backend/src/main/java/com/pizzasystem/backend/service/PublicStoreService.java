package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.StoreRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicStoreService {

    private final StoreRepository
            storeRepository;

    public PublicStoreService(
            StoreRepository storeRepository
    ) {
        this.storeRepository =
                storeRepository;
    }

    // =========================
    // RESOLVER STORE PELO SLUG
    // =========================

    @Transactional(readOnly = true)
    public Store getBySlug(
            String slug
    ) {

        if (slug == null
                || slug.isBlank()) {

            throw new IllegalArgumentException(
                    "Loja não informada."
            );
        }

        String normalizedSlug =
                slug
                        .trim()
                        .toLowerCase();

        Store store =
                storeRepository
                        .findBySlug(
                                normalizedSlug
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Loja não encontrada."
                                )
                        );

        if (!store.isActive()) {
            throw new IllegalStateException(
                    "Loja temporariamente indisponível."
            );
        }

        return store;
    }

    // =========================
    // ID DA STORE
    // =========================

    @Transactional(readOnly = true)
    public Long getStoreIdBySlug(
            String slug
    ) {

        return getBySlug(
                slug
        ).getId();
    }
}