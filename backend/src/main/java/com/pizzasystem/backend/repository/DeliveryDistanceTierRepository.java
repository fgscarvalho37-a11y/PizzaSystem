package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.DeliveryDistanceTier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryDistanceTierRepository
        extends JpaRepository<DeliveryDistanceTier, Long> {

    List<DeliveryDistanceTier>
    findByStoreIdOrderByMinDistanceKmAsc(
            Long storeId
    );

    List<DeliveryDistanceTier>
    findByStoreIdAndActiveTrueOrderByMinDistanceKmAsc(
            Long storeId
    );

    Optional<DeliveryDistanceTier>
    findByIdAndStoreId(
            Long id,
            Long storeId
    );
}
