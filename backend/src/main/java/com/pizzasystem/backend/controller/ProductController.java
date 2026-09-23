package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.AddonGroup;
import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.AddonGroupRepository;
import com.pizzasystem.backend.repository.CategoryRepository;
import com.pizzasystem.backend.repository.ProductRepository;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository
            productRepository;

    private final CategoryRepository
            categoryRepository;

    private final AddonGroupRepository
            addonGroupRepository;

    private final CurrentStoreService
            currentStoreService;

    private final PublicStoreService
            publicStoreService;

    public ProductController(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            AddonGroupRepository addonGroupRepository,
            CurrentStoreService currentStoreService,
            PublicStoreService publicStoreService
    ) {

        this.productRepository =
                productRepository;

        this.categoryRepository =
                categoryRepository;

        this.addonGroupRepository =
                addonGroupRepository;

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

        /*
         * LEGADO.
         *
         * Mantido temporariamente até
         * removermos completamente o
         * sistema antigo de bordas.
         */
        product.setAllowCrust(
                data.isAllowCrust()
        );

        product.setCategory(
                category
        );

        product.setStore(
                store
        );

        /*
         * Grupos não são aceitos diretamente
         * no cadastro do produto.
         *
         * Eles são vinculados pelo endpoint
         * específico abaixo para impedir
         * manipulação de IDs de outra loja.
         */
        product.setAddonGroups(
                new LinkedHashSet<>()
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

        /*
         * LEGADO.
         */
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

        /*
         * Os grupos atuais NÃO são alterados
         * por esse endpoint.
         *
         * Existe endpoint específico
         * para isso.
         */
        return productRepository
                .save(
                        product
                );
    }

    // =========================
    // ADMIN - GRUPOS DO PRODUTO
    // =========================

    /*
     * Recebe uma lista de IDs.
     *
     * Exemplo:
     *
     * PUT /api/products/10/addon-groups
     *
     * [
     *   1,
     *   3,
     *   5
     * ]
     *
     * Isso substitui todos os grupos
     * vinculados ao produto.
     */
    @PutMapping("/{id}/addon-groups")
    public Product updateAddonGroups(
            @PathVariable Long id,
            @RequestBody List<Long> addonGroupIds
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

        Set<AddonGroup> groups =
                new LinkedHashSet<>();

        if (addonGroupIds != null) {

            for (Long groupId : addonGroupIds) {

                if (groupId == null) {
                    continue;
                }

                AddonGroup group =
                        addonGroupRepository
                                .findByIdAndStoreId(
                                        groupId,
                                        store.getId()
                                )
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Grupo de adicionais não encontrado: "
                                                        + groupId
                                        )
                                );

                groups.add(
                        group
                );
            }
        }

        product.setAddonGroups(
                groups
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
    // ADMIN - BORDA LEGADA
    // =========================

    /*
     * Será removido quando concluirmos
     * a migração completa para adicionais.
     */
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