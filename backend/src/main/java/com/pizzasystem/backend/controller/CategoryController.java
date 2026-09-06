package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Category;
import com.pizzasystem.backend.repository.CategoryRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(
            CategoryRepository categoryRepository
    ) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<Category> listAll() {
        return categoryRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(
            @RequestBody Category category
    ) {
        return categoryRepository.save(category);
    }

    @PutMapping("/{id}")
    public Category update(
            @PathVariable Long id,
            @RequestBody Category data
    ) {
        Category category = categoryRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Categoria não encontrada"
                        ));

        category.setName(data.getName());

        return categoryRepository.save(category);
    }
}