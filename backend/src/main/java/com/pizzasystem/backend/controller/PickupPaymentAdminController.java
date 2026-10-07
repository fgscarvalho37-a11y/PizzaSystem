package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.FulfillmentType;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.PaymentTiming;
import com.pizzasystem.backend.entity.PickupPaymentMethod;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.LoyaltyService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/pickup-payments")
public class PickupPaymentAdminController {

    private final OrderRepository orderRepository;
    private final CurrentStoreService currentStoreService;
    private final CouponService couponService;
    private final LoyaltyService loyaltyService;

    public PickupPaymentAdminController(
            OrderRepository orderRepository,
            CurrentStoreService currentStoreService,
            CouponService couponService,
            LoyaltyService loyaltyService
    ) {
        this.orderRepository =
                orderRepository;
        this.currentStoreService =
                currentStoreService;
        this.couponService =
                couponService;
        this.loyaltyService =
                loyaltyService;
    }

    @PostMapping("/{orderId}/confirm")
    @Transactional
    public Order confirm(
            @PathVariable Long orderId,
            @RequestParam PickupPaymentMethod method
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
                order.getFulfillmentType() !=
                        FulfillmentType.PICKUP ||
                order.getPaymentTiming() !=
                        PaymentTiming.ON_PICKUP
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este pedido não está configurado para pagamento na retirada."
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

        order.setPickupPaymentMethod(
                method
        );
        order.setPaymentMethod(
                switch (method) {
                    case CASH ->
                            PaymentMethod.CASH;
                    case CARD ->
                            PaymentMethod.CREDIT_CARD;
                    case OTHER ->
                            PaymentMethod.OTHER;
                }
        );
        order.setPaymentProvider(
                "ON_PICKUP"
        );
        order.setPaymentStatus(
                PaymentStatus.APPROVED
        );
        order.setPaymentPaidAt(
                LocalDateTime.now()
        );
        order.setPaymentConfirmedBy(
                currentUsername()
        );

        order =
                orderRepository
                        .saveAndFlush(
                                order
                        );

        couponService.registerUsageForOrder(
                order
        );
        loyaltyService.registerForOrder(
                order
        );

        return order;
    }

    private String currentUsername() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (
                authentication == null ||
                authentication.getName() == null ||
                authentication.getName().isBlank()
        ) {
            return null;
        }

        return authentication
                .getName()
                .trim();
    }
}
