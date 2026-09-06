package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.repository.OrderRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CashService {

    private final OrderRepository orderRepository;

    public CashService(
            OrderRepository orderRepository
    ) {
        this.orderRepository =
                orderRepository;
    }

    // =========================
    // RESUMO DO CAIXA
    // =========================

    public Map<String, Object> getCashSummary(
            LocalDate date
    ) {

        if (date == null) {
            throw new RuntimeException(
                    "Data do caixa não informada"
            );
        }

        LocalDateTime start =
                date.atStartOfDay();

        LocalDateTime end =
                date.atTime(
                        LocalTime.MAX
                );

        List<Order> approvedOrders =
                orderRepository
                        .findByPaymentStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
                                PaymentStatus.APPROVED,
                                start,
                                end
                        );

        // =========================
        // TOTAL VENDIDO
        // =========================

        BigDecimal totalRevenue =
                approvedOrders.stream()
                        .map(
                                Order::getTotal
                        )
                        .filter(
                                value ->
                                        value != null
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        // =========================
        // TAXAS DE ENTREGA
        // =========================

        BigDecimal deliveryFees =
                approvedOrders.stream()
                        .map(
                                Order::getDeliveryFee
                        )
                        .filter(
                                value ->
                                        value != null
                        )
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        // =========================
        // VALOR DOS PRODUTOS
        // =========================

        BigDecimal productRevenue =
                totalRevenue.subtract(
                        deliveryFees
                );

        // =========================
        // QUANTIDADE DE PEDIDOS
        // =========================

        long orderCount =
                approvedOrders.size();

        // =========================
        // TICKET MÉDIO
        // =========================

        BigDecimal averageTicket =
                orderCount > 0
                        ? totalRevenue.divide(
                                BigDecimal.valueOf(
                                        orderCount
                                ),
                                2,
                                RoundingMode.HALF_UP
                        )
                        : BigDecimal.ZERO;

        // =========================
        // PAGAMENTOS
        // =========================

        Map<String, Long>
                ordersByPaymentMethod =
                new LinkedHashMap<>();

        Map<String, BigDecimal>
                revenueByPaymentMethod =
                new LinkedHashMap<>();

        for (
                PaymentMethod method :
                PaymentMethod.values()
        ) {

            long count =
                    approvedOrders.stream()
                            .filter(
                                    order ->
                                            order.getPaymentMethod()
                                                    == method
                            )
                            .count();

            BigDecimal revenue =
                    approvedOrders.stream()
                            .filter(
                                    order ->
                                            order.getPaymentMethod()
                                                    == method
                            )
                            .map(
                                    Order::getTotal
                            )
                            .filter(
                                    value ->
                                            value != null
                            )
                            .reduce(
                                    BigDecimal.ZERO,
                                    BigDecimal::add
                            );

            ordersByPaymentMethod.put(
                    method.name(),
                    count
            );

            revenueByPaymentMethod.put(
                    method.name(),
                    revenue
            );
        }

        // =========================
        // PEDIDOS ENTREGUES
        // =========================

        long deliveredOrders =
                approvedOrders.stream()
                        .filter(
                                order ->
                                        order.getStatus()
                                                == OrderStatus.DELIVERED
                        )
                        .count();

        // =========================
        // PEDIDOS EM ANDAMENTO
        // =========================

        long activeOrders =
                approvedOrders.stream()
                        .filter(
                                order ->
                                        order.getStatus()
                                                == OrderStatus.RECEIVED
                                        ||
                                        order.getStatus()
                                                == OrderStatus.PREPARING
                                        ||
                                        order.getStatus()
                                                == OrderStatus.READY
                                        ||
                                        order.getStatus()
                                                == OrderStatus.OUT_FOR_DELIVERY
                        )
                        .count();

        // =========================
        // CANCELADOS
        // =========================

        long cancelledOrders =
                approvedOrders.stream()
                        .filter(
                                order ->
                                        order.getStatus()
                                                == OrderStatus.CANCELLED
                        )
                        .count();

        // =========================
        // RESULTADO
        // =========================

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put(
                "date",
                date
        );

        result.put(
                "totalRevenue",
                totalRevenue
        );

        result.put(
                "productRevenue",
                productRevenue
        );

        result.put(
                "deliveryFees",
                deliveryFees
        );

        result.put(
                "orderCount",
                orderCount
        );

        result.put(
                "averageTicket",
                averageTicket
        );

        result.put(
                "deliveredOrders",
                deliveredOrders
        );

        result.put(
                "activeOrders",
                activeOrders
        );

        result.put(
                "cancelledOrders",
                cancelledOrders
        );

        result.put(
                "ordersByPaymentMethod",
                ordersByPaymentMethod
        );

        result.put(
                "revenueByPaymentMethod",
                revenueByPaymentMethod
        );

        return result;
    }
}