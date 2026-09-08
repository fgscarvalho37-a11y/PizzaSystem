package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.CategoryRepository;

import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/stores")
public class PublicStoreController {

    private final PublicStoreService
            publicStoreService;

    private final CategoryRepository
            categoryRepository;

    public PublicStoreController(
            PublicStoreService publicStoreService,
            CategoryRepository categoryRepository
    ) {

        this.publicStoreService =
                publicStoreService;

        this.categoryRepository =
                categoryRepository;
    }

    // =========================
    // PÚBLICO - CATEGORIAS DA LOJA
    // =========================

    @GetMapping("/{slug}/categories")
    public List<Category> listCategories(
            @PathVariable String slug
    ) {

        Store store =
                publicStoreService
                        .getBySlug(
                                slug
                        );

        return categoryRepository
                .findByStoreIdOrderByIdAsc(
                        store.getId()
                );
    }
}