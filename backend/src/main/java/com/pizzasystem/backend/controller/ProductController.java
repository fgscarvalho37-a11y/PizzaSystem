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

    // Lista todos os produtos
    @GetMapping
    public List<Product> listAll() {
        return productRepository.findAll();
    }

    // Lista somente produtos disponíveis
    @GetMapping("/available")
    public List<Product> listAvailable() {
        return productRepository.findByAvailableTrue();
    }

    // Lista produtos por categoria
    @GetMapping("/category/{categoryId}")
    public List<Product> listByCategory(@PathVariable Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    // Cadastra um novo produto
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@RequestBody Product product) {

        Long categoryId = product.getCategory().getId();

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));

        product.setCategory(category);

        return productRepository.save(product);
    }

    // Ativa ou desativa um produto
    @PatchMapping("/{id}/availability")
    public Product changeAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        product.setAvailable(available);

        return productRepository.save(product);
    }
}