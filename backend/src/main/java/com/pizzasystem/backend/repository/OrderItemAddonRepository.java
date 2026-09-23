package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.OrderItemAddon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemAddonRepository
        extends JpaRepository<OrderItemAddon, Long> {

    // =========================
    // ADICIONAIS DO ITEM
    // =========================

    List<OrderItemAddon> findByOrderItemIdOrderBySortOrderAscIdAsc(
            Long orderItemId
    );

    // =========================
    // ADICIONAIS DO PEDIDO
    // =========================

    List<OrderItemAddon> findByOrderItemOrderIdOrderByOrderItemIdAscSortOrderAscIdAsc(
            Long orderId
    );
}