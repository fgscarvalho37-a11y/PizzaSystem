package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.CrustRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CrustService {

    private final CrustRepository
            crustRepository;

    private final CurrentStoreService
            currentStoreService;

    private final PublicStoreService
            publicStoreService;

    public CrustService(
            CrustRepository crustRepository,
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService
    ) {

        this.crustRepository =
                crustRepository;

        this.currentStoreService =
                currentStoreService;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // ADMIN - LISTAR TODAS
    // =========================

    @Transactional(readOnly = true)
    public List<Crust> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return crustRepository
                .findByStoreIdOrderBySortOrderAscNameAsc(
                        storeId
                );
    }

    // =========================
    // PÚBLICO - LISTAR ATIVAS
    // =========================

    @Transactional(readOnly = true)
    public List<Crust> listActive(
            String storeSlug
    ) {

        Long storeId =
                publicStoreService
                        .getStoreIdBySlug(
                                storeSlug
                        );

        return crustRepository
                .findByStoreIdAndActiveTrueOrderBySortOrderAscNameAsc(
                        storeId
                );
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @Transactional(readOnly = true)
    public Crust findById(
            Long id
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return findByIdAndStore(
                id,
                storeId
        );
    }

    // =========================
    // ADMIN - CRIAR
    // =========================

    @Transactional
    public Crust create(
            Crust request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        validate(
                request,
                null,
                store.getId()
        );

        Crust crust =
                new Crust();

        crust.setName(
                normalizeName(
                        request.getName()
                )
        );

        crust.setPrice(
                normalizeMoney(
                        request.getPrice()
                )
        );

        crust.setActive(
                request.isActive()
        );

        crust.setSortOrder(
                request.getSortOrder()
        );

        /*
         * A Store sempre vem da sessão
         * do administrador.
         *
         * Nunca confiamos em store_id
         * enviado pelo frontend.
         */
        crust.setStore(
                store
        );

        return crustRepository
                .save(
                        crust
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @Transactional
    public Crust update(
            Long id,
            Crust request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        Crust crust =
                findByIdAndStore(
                        id,
                        store.getId()
                );

        validate(
                request,
                id,
                store.getId()
        );

        crust.setName(
                normalizeName(
                        request.getName()
                )
        );

        crust.setPrice(
                normalizeMoney(
                        request.getPrice()
                )
        );

        crust.setActive(
                request.isActive()
        );

        crust.setSortOrder(
                request.getSortOrder()
        );

        /*
         * Garante que uma alteração nunca
         * mova a borda para outra Store.
         */
        crust.setStore(
                store
        );

        return crustRepository
                .save(
                        crust
                );
    }

    // =========================
    // ADMIN - ATIVAR/DESATIVAR
    // =========================

    @Transactional
    public Crust changeActive(
            Long id,
            boolean active
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        Crust crust =
                findByIdAndStore(
                        id,
                        storeId
                );

        crust.setActive(
                active
        );

        return crustRepository
                .save(
                        crust
                );
    }

    // =========================
    // BUSCAR ID + STORE
    // =========================

    private Crust findByIdAndStore(
            Long id,
            Long storeId
    ) {

        return crustRepository
                .findByIdAndStoreId(
                        id,
                        storeId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Borda não encontrada."
                        )
                );
    }

    // =========================
    // VALIDAR
    // =========================

    private void validate(
            Crust crust,
            Long editingId,
            Long storeId
    ) {

        if (crust == null) {

            throw new RuntimeException(
                    "Informe os dados da borda."
            );
        }

        if (crust.getName() == null
                || crust.getName().isBlank()) {

            throw new RuntimeException(
                    "Informe o nome da borda."
            );
        }

        if (crust.getPrice() == null) {

            throw new RuntimeException(
                    "Informe o preço da borda."
            );
        }

        if (crust.getPrice()
                .compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new RuntimeException(
                    "O preço da borda não pode ser negativo."
            );
        }

        if (crust.getSortOrder() < 0) {

            throw new RuntimeException(
                    "A ordem da borda não pode ser negativa."
            );
        }

        String normalizedName =
                normalizeName(
                        crust.getName()
                );

        crustRepository
                .findByNameIgnoreCaseAndStoreId(
                        normalizedName,
                        storeId
                )
                .ifPresent(
                        existing -> {

                            boolean sameRecord =
                                    editingId != null
                                            && existing
                                            .getId()
                                            .equals(
                                                    editingId
                                            );

                            if (!sameRecord) {

                                throw new RuntimeException(
                                        "Já existe uma borda com esse nome."
                                );
                            }
                        }
                );
    }

    // =========================
    // NORMALIZAR NOME
    // =========================

    private String normalizeName(
            String name
    ) {

        return name
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }

    // =========================
    // NORMALIZAR PREÇO
    // =========================

    private BigDecimal normalizeMoney(
            BigDecimal value
    ) {

        return value
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }
}