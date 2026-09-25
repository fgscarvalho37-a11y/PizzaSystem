package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.CustomerRepository;
import com.pizzasystem.backend.repository.OrderRepository;

import com.pizzasystem.backend.service.PublicStoreService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/orders")
public class CustomerOrderController {

    private static final String SESSION_CUSTOMER_ID =
            "CUSTOMER_ID";

    private static final String SESSION_CUSTOMER_EMAIL =
            "CUSTOMER_EMAIL";

    private final OrderRepository orderRepository;

    private final CustomerRepository customerRepository;

    private final PublicStoreService publicStoreService;

    public CustomerOrderController(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            PublicStoreService publicStoreService
    ) {

        this.orderRepository =
                orderRepository;

        this.customerRepository =
                customerRepository;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // MEUS PEDIDOS
    // =========================

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> listMyOrders(
            @RequestParam(required = false) String store,
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(
                        false
                );

        if (session == null) {

            return unauthorized();
        }

        Object customerIdObject =
                session.getAttribute(
                        SESSION_CUSTOMER_ID
                );

        if (!(customerIdObject
                instanceof Number customerIdNumber)) {

            clearCustomerSession(
                    session
            );

            return unauthorized();
        }

        Long customerId =
                customerIdNumber
                        .longValue();

        Customer customer =
                customerRepository
                        .findById(
                                customerId
                        )
                        .orElse(null);

        if (customer == null
                || !customer.isActive()) {

            clearCustomerSession(
                    session
            );

            return unauthorized();
        }

        List<Order> customerOrders;

        if (
                store != null &&
                !store.isBlank()
        ) {

            Store currentStore =
                    publicStoreService
                            .getBySlug(
                                    store.trim()
                            );

            customerOrders =
                    orderRepository
                            .findByCustomerIdAndStoreIdOrderByCreatedAtDesc(
                                    customerId,
                                    currentStore.getId()
                            );

        } else {

            customerOrders =
                    orderRepository
                            .findByCustomerIdOrderByCreatedAtDesc(
                                    customerId
                            );
        }

        List<CustomerOrderResponse> orders =
                customerOrders
                        .stream()
                        .map(
                                this::toResponse
                        )
                        .toList();

        return ResponseEntity.ok(
                orders
        );
    }

    // =========================
    // DTO
    // =========================

    private CustomerOrderResponse toResponse(
            Order order
    ) {

        Long storeId =
                order.getStore() != null
                        ? order
                                .getStore()
                                .getId()
                        : null;

        String storeName =
                order.getStore() != null
                        ? order
                                .getStore()
                                .getName()
                        : null;

        String storeSlug =
                order.getStore() != null
                        ? order
                                .getStore()
                                .getSlug()
                        : null;

        return new CustomerOrderResponse(
                order.getId(),
                storeId,
                storeName,
                storeSlug,
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getTotal(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                order.getCreatedAt(),
                order.getPublicAccessToken()
        );
    }

    // =========================
    // LIMPAR SESSÃO
    // =========================

    private void clearCustomerSession(
            HttpSession session
    ) {

        session.removeAttribute(
                SESSION_CUSTOMER_ID
        );

        session.removeAttribute(
                SESSION_CUSTOMER_EMAIL
        );
    }

    // =========================
    // NÃO AUTENTICADO
    // =========================

    private ResponseEntity<?> unauthorized() {

        return ResponseEntity
                .status(
                        HttpStatus.UNAUTHORIZED
                )
                .body(
                        Map.of(
                                "authenticated",
                                false,
                                "message",
                                "Cliente não autenticado"
                        )
                );
    }

    // =========================
    // RESPOSTA
    // =========================

    public record CustomerOrderResponse(

            Long id,

            Long storeId,

            String storeName,

            String storeSlug,

            String customerName,

            String customerPhone,

            BigDecimal total,

            OrderStatus status,

            PaymentStatus paymentStatus,

            PaymentMethod paymentMethod,

            LocalDateTime createdAt,

            String publicAccessToken
    ) {
    }
}