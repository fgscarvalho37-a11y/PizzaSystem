package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;

import com.pizzasystem.backend.repository.OrderRepository;

import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.LoyaltyService;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/cash-payments")
public class CashPaymentAdminController {

    private final OrderRepository orderRepository;
    private final CurrentStoreService currentStoreService;
    private final CouponService couponService;
    private final LoyaltyService loyaltyService;

    public CashPaymentAdminController(
            OrderRepository orderRepository,
            CurrentStoreService currentStoreService,
            CouponService couponService,
            LoyaltyService loyaltyService
    ) {
        this.orderRepository = orderRepository;
        this.currentStoreService = currentStoreService;
        this.couponService = couponService;
        this.loyaltyService = loyaltyService;
    }

    @PostMapping("/{orderId}/confirm")
    @Transactional
    public Order confirm(
            @PathVariable Long orderId
    ) {
        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        Order order =
                orderRepository
                        .findByIdAndStoreId(
                                orderId,
                                storeId
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "Pedido não encontrado."
                                        )
                        );

        if (
                order.getPaymentMethod() !=
                        PaymentMethod.CASH
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este pedido não é um pagamento em dinheiro."
            );
        }

        if (
                order.getStatus() ==
                        OrderStatus.CANCELLED
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pedido cancelado não pode ser marcado como pago."
            );
        }

        if (
                order.getPaymentStatus() ==
                        PaymentStatus.APPROVED
        ) {
            return order;
        }

        if (
                order.getPaymentStatus() !=
                        PaymentStatus.PENDING
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "O pagamento deste pedido não está pendente."
            );
        }

        order.setPaymentStatus(
                PaymentStatus.APPROVED
        );
        order.setPaymentProvider(
                "CASH"
        );
        order.setPaymentPaidAt(
                LocalDateTime.now()
        );

        order =
                orderRepository.save(order);

        couponService.registerUsageForOrder(
                order
        );
        loyaltyService.registerForOrder(
                order
        );

        return order;
    }
}
