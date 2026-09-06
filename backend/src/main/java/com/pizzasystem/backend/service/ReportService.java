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
public class ReportService {

    private final OrderRepository orderRepository;

    public ReportService(
            OrderRepository orderRepository
    ) {
        this.orderRepository = orderRepository;
    }

    // =========================
    // RELATÓRIO POR PERÍODO
    // =========================

    public Map<String, Object> getReport(
            LocalDate startDate,
            LocalDate endDate
    ) {

        if (startDate == null || endDate == null) {
            throw new RuntimeException(
                    "Data inicial e final são obrigatórias"
            );
        }

        if (endDate.isBefore(startDate)) {
            throw new RuntimeException(
                    "A data final não pode ser anterior à data inicial"
            );
        }

        LocalDateTime start =
                startDate.atStartOfDay();

        LocalDateTime end =
                endDate.atTime(LocalTime.MAX);

        List<Order> approvedOrders =
                orderRepository
                        .findByPaymentStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
                                PaymentStatus.APPROVED,
                                start,
                                end
                        );

        // =========================
        // FATURAMENTO
        // =========================

        BigDecimal revenue =
                approvedOrders.stream()
                        .map(Order::getTotal)
                        .filter(total -> total != null)
                        .reduce(
                                BigDecimal.ZERO,
                                BigDecimal::add
                        );

        long orderCount =
                approvedOrders.size();

        BigDecimal averageTicket =
                orderCount > 0
                        ? revenue.divide(
                                BigDecimal.valueOf(orderCount),
                                2,
                                RoundingMode.HALF_UP
                        )
                        : BigDecimal.ZERO;

        // =========================
        // FORMAS DE PAGAMENTO
        // =========================

        Map<String, Long> ordersByPaymentMethod =
                new LinkedHashMap<>();

        Map<String, BigDecimal> revenueByPaymentMethod =
                new LinkedHashMap<>();

        for (PaymentMethod method :
                PaymentMethod.values()) {

            long count =
                    approvedOrders.stream()
                            .filter(order ->
                                    order.getPaymentMethod() == method
                            )
                            .count();

            BigDecimal methodRevenue =
                    approvedOrders.stream()
                            .filter(order ->
                                    order.getPaymentMethod() == method
                            )
                            .map(Order::getTotal)
                            .filter(total -> total != null)
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
                    methodRevenue
            );
        }

        // =========================
        // STATUS DOS PEDIDOS
        // =========================

        Map<String, Long> ordersByStatus =
                new LinkedHashMap<>();

        for (OrderStatus status :
                OrderStatus.values()) {

            long count =
                    approvedOrders.stream()
                            .filter(order ->
                                    order.getStatus() == status
                            )
                            .count();

            ordersByStatus.put(
                    status.name(),
                    count
            );
        }

        // =========================
        // RESULTADO
        // =========================

        Map<String, Object> report =
                new LinkedHashMap<>();

        report.put(
                "startDate",
                startDate
        );

        report.put(
                "endDate",
                endDate
        );

        report.put(
                "revenue",
                revenue
        );

        report.put(
                "orderCount",
                orderCount
        );

        report.put(
                "averageTicket",
                averageTicket
        );

        report.put(
                "ordersByPaymentMethod",
                ordersByPaymentMethod
        );

        report.put(
                "revenueByPaymentMethod",
                revenueByPaymentMethod
        );

        report.put(
                "ordersByStatus",
                ordersByStatus
        );

        return report;
    }
}