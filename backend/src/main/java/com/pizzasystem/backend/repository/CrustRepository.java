package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Crust;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CrustRepository
        extends JpaRepository<Crust, Long> {

    Optional<Crust> findByNameIgnoreCase(
            String name
    );

    boolean existsByNameIgnoreCase(
            String name
    );

    List<Crust> findAllByOrderBySortOrderAscNameAsc();

    List<Crust> findByActiveTrueOrderBySortOrderAscNameAsc();
}