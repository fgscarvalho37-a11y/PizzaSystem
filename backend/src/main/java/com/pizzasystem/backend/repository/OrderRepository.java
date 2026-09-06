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

    List<Order> findByStatus(
            OrderStatus status
    );

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatusOrderByCreatedAtDesc(
            OrderStatus status
    );

    /*
     * Mantemos este método porque outra parte
     * do sistema ainda pode utilizá-lo.
     */
    long countByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    /*
     * Usado para o limite diário.
     *
     * Conta somente pedidos com pagamento
     * aprovado dentro do período.
     *
     * Assim pedidos abandonados, pendentes
     * ou recusados não gastam uma vaga
     * do limite diário da pizzaria.
     */
    long countByPaymentStatusAndCreatedAtBetween(
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );

    Optional<Order> findByPaymentExternalId(
            String paymentExternalId
    );
}