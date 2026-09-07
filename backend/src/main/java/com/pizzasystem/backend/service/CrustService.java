package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.repository.CrustRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class CrustService {

    private final CrustRepository crustRepository;

    public CrustService(
            CrustRepository crustRepository
    ) {
        this.crustRepository =
                crustRepository;
    }

    // =========================
    // LISTAR TODAS
    // =========================

    public List<Crust> listAll() {

        return crustRepository
                .findAllByOrderBySortOrderAscNameAsc();
    }

    // =========================
    // LISTAR ATIVAS
    // =========================

    public List<Crust> listActive() {

        return crustRepository
                .findByActiveTrueOrderBySortOrderAscNameAsc();
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    public Crust findById(
            Long id
    ) {

        return crustRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Borda não encontrada."
                        )
                );
    }

    // =========================
    // CRIAR
    // =========================

    @Transactional
    public Crust create(
            Crust crust
    ) {

        validate(
                crust,
                null
        );

        crust.setName(
                normalizeName(
                        crust.getName()
                )
        );

        crust.setPrice(
                normalizeMoney(
                        crust.getPrice()
                )
        );

        return crustRepository
                .save(crust);
    }

    // =========================
    // ATUALIZAR
    // =========================

    @Transactional
    public Crust update(
            Long id,
            Crust request
    ) {

        Crust crust =
                findById(id);

        validate(
                request,
                id
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

        return crustRepository
                .save(crust);
    }

    // =========================
    // ATIVAR / DESATIVAR
    // =========================

    @Transactional
    public Crust changeActive(
            Long id,
            boolean active
    ) {

        Crust crust =
                findById(id);

        crust.setActive(
                active
        );

        return crustRepository
                .save(crust);
    }

    // =========================
    // VALIDAR
    // =========================

    private void validate(
            Crust crust,
            Long editingId
    ) {

        if (crust == null) {

            throw new RuntimeException(
                    "Informe os dados da borda."
            );
        }

        if (crust.getName() == null
                || crust.getName()
                .isBlank()) {

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
                .findByNameIgnoreCase(
                        normalizedName
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