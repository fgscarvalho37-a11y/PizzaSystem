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

    // =========================
    // PEDIDOS POR STATUS
    // =========================

    List<Order> findByStatus(
            OrderStatus status
    );

    List<Order> findByStatusOrderByCreatedAtDesc(
            OrderStatus status
    );

    // =========================
    // TODOS OS PEDIDOS
    // =========================

    List<Order> findAllByOrderByCreatedAtDesc();

    // =========================
    // CONTAGEM GERAL POR PERÍODO
    // =========================

    long countByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    // =========================
    // CONTAGEM POR PAGAMENTO
    // =========================

    long countByPaymentStatusAndCreatedAtBetween(
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );

    // =========================
    // PEDIDOS APROVADOS POR PERÍODO
    // =========================

    /*
     * Usado pelos relatórios.
     *
     * Retorna os pedidos com determinado
     * status de pagamento dentro do período,
     * ordenados do mais recente para o mais antigo.
     *
     * Com isso conseguimos calcular:
     *
     * - faturamento
     * - quantidade de pedidos
     * - ticket médio
     * - vendas por forma de pagamento
     * - vendas por status do pedido
     */
    List<Order> findByPaymentStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            PaymentStatus paymentStatus,
            LocalDateTime start,
            LocalDateTime end
    );

    // =========================
    // PAGAMENTO EXTERNO
    // =========================

    Optional<Order> findByPaymentExternalId(
            String paymentExternalId
    );
    // =========================
// ACESSO PÚBLICO SEGURO
// =========================

Optional<Order> findByIdAndPublicAccessToken(
        Long id,
        String publicAccessToken
);
}