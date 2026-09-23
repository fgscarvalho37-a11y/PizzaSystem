package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Addon;
import com.pizzasystem.backend.entity.AddonGroup;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.AddonGroupRepository;
import com.pizzasystem.backend.repository.AddonRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class AddonService {

    private final AddonRepository
            addonRepository;

    private final AddonGroupRepository
            addonGroupRepository;

    private final CurrentStoreService
            currentStoreService;

    public AddonService(
            AddonRepository addonRepository,
            AddonGroupRepository addonGroupRepository,
            CurrentStoreService currentStoreService
    ) {

        this.addonRepository =
                addonRepository;

        this.addonGroupRepository =
                addonGroupRepository;

        this.currentStoreService =
                currentStoreService;
    }

    // =========================
    // ADMIN - LISTAR POR GRUPO
    // =========================

    @Transactional(readOnly = true)
    public List<Addon> listByGroup(
            Long groupId
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        findGroupByIdAndStore(
                groupId,
                storeId
        );

        return addonRepository
                .findByGroupIdAndStoreIdOrderBySortOrderAscNameAsc(
                        groupId,
                        storeId
                );
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @Transactional(readOnly = true)
    public Addon findById(
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
    public Addon create(
            Long groupId,
            Addon request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        AddonGroup group =
                findGroupByIdAndStore(
                        groupId,
                        store.getId()
                );

        validate(
                request,
                null,
                groupId,
                store.getId()
        );

        Addon addon =
                new Addon();

        addon.setName(
                normalizeName(
                        request.getName()
                )
        );

        addon.setDescription(
                normalizeDescription(
                        request.getDescription()
                )
        );

        addon.setPrice(
                normalizeMoney(
                        request.getPrice()
                )
        );

        addon.setActive(
                request.isActive()
        );

        addon.setSortOrder(
                request.getSortOrder()
        );

        addon.setGroup(
                group
        );

        /*
         * Nunca usamos store_id enviado
         * pelo frontend.
         *
         * A loja sempre vem da sessão
         * do administrador.
         */
        addon.setStore(
                store
        );

        return addonRepository
                .save(
                        addon
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @Transactional
    public Addon update(
            Long groupId,
            Long id,
            Addon request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        Addon addon =
                findByIdAndStore(
                        id,
                        store.getId()
                );

        AddonGroup group =
                findGroupByIdAndStore(
                        groupId,
                        store.getId()
                );

        validate(
                request,
                id,
                groupId,
                store.getId()
        );

        addon.setName(
                normalizeName(
                        request.getName()
                )
        );

        addon.setDescription(
                normalizeDescription(
                        request.getDescription()
                )
        );

        addon.setPrice(
                normalizeMoney(
                        request.getPrice()
                )
        );

        addon.setActive(
                request.isActive()
        );

        addon.setSortOrder(
                request.getSortOrder()
        );

        /*
         * Permite mover um adicional
         * entre grupos da MESMA loja.
         *
         * Nunca permite usar grupo
         * pertencente a outra loja.
         */
        addon.setGroup(
                group
        );

        addon.setStore(
                store
        );

        return addonRepository
                .save(
                        addon
                );
    }

    // =========================
    // ADMIN - ATIVAR/DESATIVAR
    // =========================

    @Transactional
    public Addon changeActive(
            Long id,
            boolean active
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        Addon addon =
                findByIdAndStore(
                        id,
                        storeId
                );

        addon.setActive(
                active
        );

        return addonRepository
                .save(
                        addon
                );
    }

    // =========================
    // BUSCAR ADICIONAL
    // =========================

    private Addon findByIdAndStore(
            Long id,
            Long storeId
    ) {

        return addonRepository
                .findByIdAndStoreId(
                        id,
                        storeId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Adicional não encontrado."
                        )
                );
    }

    // =========================
    // BUSCAR GRUPO
    // =========================

    private AddonGroup findGroupByIdAndStore(
            Long groupId,
            Long storeId
    ) {

        if (groupId == null) {

            throw new RuntimeException(
                    "Informe o grupo do adicional."
            );
        }

        return addonGroupRepository
                .findByIdAndStoreId(
                        groupId,
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
            Addon addon,
            Long editingId,
            Long groupId,
            Long storeId
    ) {

        if (addon == null) {

            throw new RuntimeException(
                    "Informe os dados do adicional."
            );
        }

        if (addon.getName() == null
                || addon.getName().isBlank()) {

            throw new RuntimeException(
                    "Informe o nome do adicional."
            );
        }

        if (addon.getPrice() == null) {

            throw new RuntimeException(
                    "Informe o preço do adicional."
            );
        }

        if (addon.getPrice()
                .compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new RuntimeException(
                    "O preço do adicional não pode ser negativo."
            );
        }

        if (addon.getSortOrder() < 0) {

            throw new RuntimeException(
                    "A ordem do adicional não pode ser negativa."
            );
        }

        String normalizedName =
                normalizeName(
                        addon.getName()
                );

        addonRepository
                .findByNameIgnoreCaseAndGroupIdAndStoreId(
                        normalizedName,
                        groupId,
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
                                        "Já existe um adicional com esse nome neste grupo."
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