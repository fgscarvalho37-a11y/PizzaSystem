package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.repository.CategoryRepository;
import com.pizzasystem.backend.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductController(
            ProductRepository productRepository,
            CategoryRepository categoryRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    // LISTAR TODOS
    @GetMapping
    public List<Product> listAll() {
        return productRepository.findAll();
    }

    // LISTAR DISPONÍVEIS
    @GetMapping("/available")
    public List<Product> listAvailable() {
        return productRepository.findByAvailableTrue();
    }

    // LISTAR POR CATEGORIA
    @GetMapping("/category/{categoryId}")
    public List<Product> listByCategory(
            @PathVariable Long categoryId
    ) {
        return productRepository.findByCategoryId(categoryId);
    }

    // CADASTRAR
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@RequestBody Product product) {

        Long categoryId = product.getCategory().getId();

        Category category = categoryRepository
                .findById(categoryId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Categoria não encontrada"
                        ));

        product.setCategory(category);

        return productRepository.save(product);
    }

    // EDITAR PRODUTO
    @PutMapping("/{id}")
    public Product update(
            @PathVariable Long id,
            @RequestBody Product data
    ) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Produto não encontrado"
                        ));

        Category category = categoryRepository
                .findById(data.getCategory().getId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Categoria não encontrada"
                        ));

        product.setName(data.getName());
        product.setDescription(data.getDescription());
        product.setImageUrl(data.getImageUrl());
        product.setPrice(data.getPrice());
        product.setAvailable(data.isAvailable());
        product.setCategory(category);

        return productRepository.save(product);
    }

    // ATIVAR / DESATIVAR
    @PatchMapping("/{id}/availability")
    public Product changeAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {

        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Produto não encontrado"
                        ));

        product.setAvailable(available);

        return productRepository.save(product);
    }
}