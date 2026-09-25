package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.DeliveryArea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryAreaRepository
        extends JpaRepository<DeliveryArea, Long> {

    List<DeliveryArea>
    findByStoreIdOrderByCityAscNeighborhoodAsc(
            Long storeId
    );

    List<DeliveryArea>
    findByStoreIdAndActiveTrueOrderByCityAscNeighborhoodAsc(
            Long storeId
    );

    Optional<DeliveryArea>
    findByIdAndStoreId(
            Long id,
            Long storeId
    );

    Optional<DeliveryArea>
    findByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCaseAndActiveTrue(
            Long storeId,
            String city,
            String neighborhood
    );

    Optional<DeliveryArea>
    findByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCase(
            Long storeId,
            String city,
            String neighborhood
    );

    boolean existsByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCase(
            Long storeId,
            String city,
            String neighborhood
    );

    /*
     * Métodos mantidos para compatibilidade com
     * registros antigos que ainda não têm cidade.
     */
    List<DeliveryArea>
    findByStoreIdOrderByNeighborhoodAsc(
            Long storeId
    );

    List<DeliveryArea>
    findByStoreIdAndActiveTrueOrderByNeighborhoodAsc(
            Long storeId
    );

    Optional<DeliveryArea>
    findByStoreIdAndNeighborhoodIgnoreCaseAndActiveTrue(
            Long storeId,
            String neighborhood
    );

    Optional<DeliveryArea>
    findByStoreIdAndNeighborhoodIgnoreCase(
            Long storeId,
            String neighborhood
    );

    boolean existsByStoreIdAndNeighborhoodIgnoreCase(
            Long storeId,
            String neighborhood
    );

    List<DeliveryArea>
    findByActiveTrueOrderByNeighborhoodAsc();

    Optional<DeliveryArea>
    findByNeighborhoodIgnoreCaseAndActiveTrue(
            String neighborhood
    );
}
