package com.pizzasystem.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pizzasystem.backend.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}