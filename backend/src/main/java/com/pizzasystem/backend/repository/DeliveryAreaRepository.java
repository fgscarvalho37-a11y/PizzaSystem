package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.DeliveryArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryAreaRepository
        extends JpaRepository<DeliveryArea, Long> {

    List<DeliveryArea> findByActiveTrueOrderByNeighborhoodAsc();

    Optional<DeliveryArea> findByNeighborhoodIgnoreCaseAndActiveTrue(
            String neighborhood
    );
}