package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.CategoryRepository;

import com.pizzasystem.backend.service.CurrentStoreService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository
            categoryRepository;

    private final CurrentStoreService
            currentStoreService;

    public CategoryController(
            CategoryRepository categoryRepository,
            CurrentStoreService currentStoreService
    ) {

        this.categoryRepository =
                categoryRepository;

        this.currentStoreService =
                currentStoreService;
    }

    // =========================
    // ADMIN - LISTAR CATEGORIAS
    // =========================

    @GetMapping
    public List<Category> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return categoryRepository
                .findByStoreIdOrderByIdAsc(
                        storeId
                );
    }

    // =========================
    // ADMIN - CRIAR
    // =========================

    @PostMapping
    @ResponseStatus(
            HttpStatus.CREATED
    )
    public Category create(
            @RequestBody Category data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        String name =
                normalizeName(
                        data.getName()
                );

        if (
                categoryRepository
                        .existsByNameIgnoreCaseAndStoreId(
                                name,
                                store.getId()
                        )
        ) {

            throw new IllegalArgumentException(
                    "Já existe uma categoria com este nome."
            );
        }

        Category category =
                new Category();

        category.setName(
                name
        );

        category.setStore(
                store
        );

        return categoryRepository
                .save(
                        category
                );
    }

    // =========================
    // ADMIN - EDITAR
    // =========================

    @PutMapping("/{id}")
    public Category update(
            @PathVariable Long id,
            @RequestBody Category data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        Category category =
                categoryRepository
                        .findByIdAndStoreId(
                                id,
                                store.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Categoria não encontrada"
                                )
                        );

        String name =
                normalizeName(
                        data.getName()
                );

        if (
                !category
                        .getName()
                        .equalsIgnoreCase(
                                name
                        )
                &&
                categoryRepository
                        .existsByNameIgnoreCaseAndStoreId(
                                name,
                                store.getId()
                        )
        ) {

            throw new IllegalArgumentException(
                    "Já existe uma categoria com este nome."
            );
        }

        category.setName(
                name
        );

        return categoryRepository
                .save(
                        category
                );
    }

    // =========================
    // NORMALIZAR NOME
    // =========================

    private String normalizeName(
            String name
    ) {

        if (name == null
                || name.isBlank()) {

            throw new IllegalArgumentException(
                    "Nome da categoria é obrigatório."
            );
        }

        return name.trim();
    }
}