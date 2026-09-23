package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.AddonGroup;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.AddonGroupRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddonGroupService {

    private final AddonGroupRepository
            addonGroupRepository;

    private final CurrentStoreService
            currentStoreService;

    public AddonGroupService(
            AddonGroupRepository addonGroupRepository,
            CurrentStoreService currentStoreService
    ) {

        this.addonGroupRepository =
                addonGroupRepository;

        this.currentStoreService =
                currentStoreService;
    }

    // =========================
    // ADMIN - LISTAR TODOS
    // =========================

    @Transactional(readOnly = true)
    public List<AddonGroup> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return addonGroupRepository
                .findByStoreIdOrderBySortOrderAscNameAsc(
                        storeId
                );
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @Transactional(readOnly = true)
    public AddonGroup findById(
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
    public AddonGroup create(
            AddonGroup request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        validate(
                request,
                null,
                store.getId()
        );

        AddonGroup group =
                new AddonGroup();

        group.setName(
                normalizeName(
                        request.getName()
                )
        );

        group.setDescription(
                normalizeDescription(
                        request.getDescription()
                )
        );

        group.setRequired(
                request.isRequired()
        );

        group.setMinSelections(
                request.getMinSelections()
        );

        group.setMaxSelections(
                request.getMaxSelections()
        );

        group.setActive(
                request.isActive()
        );

        group.setSortOrder(
                request.getSortOrder()
        );

        /*
         * A loja sempre é obtida pela
         * sessão do administrador.
         *
         * Nunca confiamos em store_id
         * enviado pelo frontend.
         */
        group.setStore(
                store
        );

        return addonGroupRepository
                .save(
                        group
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @Transactional
    public AddonGroup update(
            Long id,
            AddonGroup request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        AddonGroup group =
                findByIdAndStore(
                        id,
                        store.getId()
                );

        validate(
                request,
                id,
                store.getId()
        );

        group.setName(
                normalizeName(
                        request.getName()
                )
        );

        group.setDescription(
                normalizeDescription(
                        request.getDescription()
                )
        );

        group.setRequired(
                request.isRequired()
        );

        group.setMinSelections(
                request.getMinSelections()
        );

        group.setMaxSelections(
                request.getMaxSelections()
        );

        group.setActive(
                request.isActive()
        );

        group.setSortOrder(
                request.getSortOrder()
        );

        /*
         * Garante que o grupo nunca
         * seja movido para outra loja.
         */
        group.setStore(
                store
        );

        return addonGroupRepository
                .save(
                        group
                );
    }

    // =========================
    // ADMIN - ATIVAR/DESATIVAR
    // =========================

    @Transactional
    public AddonGroup changeActive(
            Long id,
            boolean active
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        AddonGroup group =
                findByIdAndStore(
                        id,
                        storeId
                );

        group.setActive(
                active
        );

        return addonGroupRepository
                .save(
                        group
                );
    }

    // =========================
    // BUSCAR ID + LOJA
    // =========================

    private AddonGroup findByIdAndStore(
            Long id,
            Long storeId
    ) {

        return addonGroupRepository
                .findByIdAndStoreId(
                        id,
                        storeId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Grupo de adicionais não encontrado."
                        )
                );
    }

    // =========================
    // VALIDAR
    // =========================

    private void validate(
            AddonGroup group,
            Long editingId,
            Long storeId
    ) {

        if (group == null) {

            throw new RuntimeException(
                    "Informe os dados do grupo de adicionais."
            );
        }

        if (group.getName() == null
                || group.getName().isBlank()) {

            throw new RuntimeException(
                    "Informe o nome do grupo."
            );
        }

        if (group.getMinSelections() < 0) {

            throw new RuntimeException(
                    "A quantidade mínima não pode ser negativa."
            );
        }

        if (group.getMaxSelections() < 1) {

            throw new RuntimeException(
                    "A quantidade máxima deve ser pelo menos 1."
            );
        }

        if (group.getMinSelections()
                > group.getMaxSelections()) {

            throw new RuntimeException(
                    "A quantidade mínima não pode ser maior que a máxima."
            );
        }

        if (group.isRequired()
                && group.getMinSelections() < 1) {

            throw new RuntimeException(
                    "Um grupo obrigatório deve exigir pelo menos 1 seleção."
            );
        }

        if (!group.isRequired()
                && group.getMinSelections() > 0) {

            throw new RuntimeException(
                    "Um grupo opcional deve ter quantidade mínima igual a 0."
            );
        }

        if (group.getSortOrder() < 0) {

            throw new RuntimeException(
                    "A ordem do grupo não pode ser negativa."
            );
        }

        String normalizedName =
                normalizeName(
                        group.getName()
                );

        addonGroupRepository
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
                                        "Já existe um grupo com esse nome."
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
    // NORMALIZAR DESCRIÇÃO
    // =========================

    private String normalizeDescription(
            String description
    ) {

        if (description == null
                || description.isBlank()) {

            return null;
        }

        return description
                .trim()
                .replaceAll(
                        "\\s+",
                        " "
                );
    }
}