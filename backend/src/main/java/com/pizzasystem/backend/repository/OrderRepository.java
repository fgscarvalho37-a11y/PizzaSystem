package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository
        extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndStoreId(
            Long id,
            Long storeId
    );

    List<Order> findByStoreIdAndStatus(
            Long storeId,
            OrderStatus status
    );

    List<Order> findByStoreIdAndStatusOrderByCreatedAtDesc(
            Long storeId,
            OrderStatus status
    );

    List<Order> findByStoreIdOrderByCreatedAtDesc(
            Long storeId
    );

    long countByStoreIdAndCreatedAtBetween(
            Long storeId,
            LocalDateTime start,
            LocalDateTime end
    );

    long countByStoreIdAndPaymentStatusAndCreatedAtBetween(
            Long storeId,
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Order>
    findByStoreIdAndPaymentStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long storeId,
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );

    Optional<Order> findByPaymentExternalId(
            String paymentExternalId
    );

    Optional<Order> findByIdAndPublicAccessToken(
            Long id,
            String publicAccessToken
    );

    // =========================
    // LEGADOS TEMPORÁRIOS
    // =========================

    List<Order> findByStatus(
            OrderStatus status
    );

    List<Order> findByStatusOrderByCreatedAtDesc(
            OrderStatus status
    );

    List<Order> findAllByOrderByCreatedAtDesc();

    long countByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    long countByPaymentStatusAndCreatedAtBetween(
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );

    List<Order>
    findByPaymentStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );
}