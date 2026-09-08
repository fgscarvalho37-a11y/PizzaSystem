package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.CategoryRepository;
import com.pizzasystem.backend.repository.ProductRepository;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository
            productRepository;

    private final CategoryRepository
            categoryRepository;

    private final CurrentStoreService
            currentStoreService;

    private final PublicStoreService
            publicStoreService;

    public ProductController(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService
    ) {

        this.productRepository =
                productRepository;

        this.categoryRepository =
                categoryRepository;

        this.currentStoreService =
                currentStoreService;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // ADMIN - LISTAR TODOS
    // =========================

    @GetMapping
    public List<Product> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return productRepository
                .findByStoreIdOrderByIdAsc(
                        storeId
                );
    }

    // =========================
    // PÚBLICO - PRODUTOS DISPONÍVEIS
    // =========================

    @GetMapping("/available")
    public List<Product> listAvailable(
            @RequestParam String store
    ) {

        Long storeId =
                publicStoreService
                        .getStoreIdBySlug(
                                store
                        );

        return productRepository
                .findByStoreIdAndAvailableTrueOrderByIdAsc(
                        storeId
                );
    }

    // =========================
    // PÚBLICO - POR CATEGORIA
    // =========================

    @GetMapping("/category/{categoryId}")
    public List<Product> listByCategory(
            @PathVariable Long categoryId,
            @RequestParam String store
    ) {

        Long storeId =
                publicStoreService
                        .getStoreIdBySlug(
                                store
                        );

        categoryRepository
                .findByIdAndStoreId(
                        categoryId,
                        storeId
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Categoria não encontrada"
                        )
                );

        return productRepository
                .findByStoreIdAndCategoryIdAndAvailableTrueOrderByIdAsc(
                        storeId,
                        categoryId
                );
    }

    // =========================
    // ADMIN - CADASTRAR
    // =========================

    @PostMapping
    @ResponseStatus(
            HttpStatus.CREATED
    )
    public Product create(
            @RequestBody Product data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        Category category =
                getAdminCategory(
                        data,
                        store
                );

        validateProduct(
                data
        );

        Product product =
                new Product();

        product.setName(
                data.getName().trim()
        );

        product.setDescription(
                normalizeNullable(
                        data.getDescription()
                )
        );

        product.setImageUrl(
                normalizeNullable(
                        data.getImageUrl()
                )
        );

        product.setPrice(
                data.getPrice()
        );

        product.setAvailable(
                data.isAvailable()
        );

        product.setAllowCrust(
                data.isAllowCrust()
        );

        product.setCategory(
                category
        );

        product.setStore(
                store
        );

        return productRepository
                .save(
                        product
                );
    }

    // =========================
    // ADMIN - EDITAR
    // =========================

    @PutMapping("/{id}")
    public Product update(
            @PathVariable Long id,
            @RequestBody Product data
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        Product product =
                productRepository
                        .findByIdAndStoreId(
                                id,
                                store.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produto não encontrado"
                                )
                        );

        Category category =
                getAdminCategory(
                        data,
                        store
                );

        validateProduct(
                data
        );

        product.setName(
                data.getName().trim()
        );

        product.setDescription(
                normalizeNullable(
                        data.getDescription()
                )
        );

        product.setImageUrl(
                normalizeNullable(
                        data.getImageUrl()
                )
        );

        product.setPrice(
                data.getPrice()
        );

        product.setAvailable(
                data.isAvailable()
        );

        product.setAllowCrust(
                data.isAllowCrust()
        );

        product.setCategory(
                category
        );

        /*
         * Mesmo que alguém manipule o JSON,
         * a Store nunca vem do frontend.
         */
        product.setStore(
                store
        );

        return productRepository
                .save(
                        product
                );
    }

    // =========================
    // ADMIN - DISPONIBILIDADE
    // =========================

    @PatchMapping("/{id}/availability")
    public Product changeAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        Product product =
                productRepository
                        .findByIdAndStoreId(
                                id,
                                storeId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produto não encontrado"
                                )
                        );

        product.setAvailable(
                available
        );

        return productRepository
                .save(
                        product
                );
    }

    // =========================
    // ADMIN - BORDA
    // =========================

    @PatchMapping("/{id}/allow-crust")
    public Product changeAllowCrust(
            @PathVariable Long id,
            @RequestParam boolean allowCrust
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        Product product =
                productRepository
                        .findByIdAndStoreId(
                                id,
                                storeId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Produto não encontrado"
                                )
                        );

        product.setAllowCrust(
                allowCrust
        );

        return productRepository
                .save(
                        product
                );
    }

    // =========================
    // CATEGORIA DO ADMIN
    // =========================

    private Category getAdminCategory(
            Product data,
            Store store
    ) {

        if (data.getCategory() == null
                || data.getCategory().getId() == null) {

            throw new IllegalArgumentException(
                    "Categoria é obrigatória."
            );
        }

        return categoryRepository
                .findByIdAndStoreId(
                        data.getCategory().getId(),
                        store.getId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Categoria não encontrada"
                        )
                );
    }

    // =========================
    // VALIDAR
    // =========================

    private void validateProduct(
            Product product
    ) {

        if (product.getName() == null
                || product.getName().isBlank()) {

            throw new IllegalArgumentException(
                    "Nome do produto é obrigatório."
            );
        }

        BigDecimal price =
                product.getPrice();

        if (price == null
                || price.compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new IllegalArgumentException(
                    "Preço do produto inválido."
            );
        }
    }

    // =========================
    // STRING OPCIONAL
    // =========================

    private String normalizeNullable(
            String value
    ) {

        if (value == null) {
            return null;
        }

        String normalized =
                value.trim();

        return normalized.isBlank()
                ? null
                : normalized;
    }
}