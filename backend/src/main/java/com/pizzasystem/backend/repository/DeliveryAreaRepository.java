package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.DeliveryArea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryAreaRepository
        extends JpaRepository<DeliveryArea, Long> {

    // =========================
    // SAAS - TODAS DA LOJA
    // =========================

    List<DeliveryArea>
    findByStoreIdOrderByNeighborhoodAsc(
            Long storeId
    );

    // =========================
    // SAAS - ATIVAS DA LOJA
    // =========================

    List<DeliveryArea>
    findByStoreIdAndActiveTrueOrderByNeighborhoodAsc(
            Long storeId
    );

    // =========================
    // SAAS - BUSCAR POR ID
    // =========================

    Optional<DeliveryArea>
    findByIdAndStoreId(
            Long id,
            Long storeId
    );

    // =========================
    // SAAS - BAIRRO ATIVO
    // =========================

    Optional<DeliveryArea>
    findByStoreIdAndNeighborhoodIgnoreCaseAndActiveTrue(
            Long storeId,
            String neighborhood
    );

    // =========================
    // SAAS - BAIRRO DA LOJA
    // =========================

    Optional<DeliveryArea>
    findByStoreIdAndNeighborhoodIgnoreCase(
            Long storeId,
            String neighborhood
    );

    boolean existsByStoreIdAndNeighborhoodIgnoreCase(
            Long storeId,
            String neighborhood
    );

    // =========================
    // MÉTODOS LEGADOS
    // =========================

    /*
     * Mantidos temporariamente enquanto
     * terminamos a migração SaaS.
     */

    List<DeliveryArea>
    findByActiveTrueOrderByNeighborhoodAsc();

    Optional<DeliveryArea>
    findByNeighborhoodIgnoreCaseAndActiveTrue(
            String neighborhood
    );
}