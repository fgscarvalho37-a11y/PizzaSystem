package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.OrderItemRequest;
import com.pizzasystem.backend.dto.OrderRequest;
import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderItem;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.repository.DeliveryAreaRepository;
import com.pizzasystem.backend.repository.OrderItemRepository;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.ProductRepository;
import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.StoreStatusService;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final StoreStatusService storeStatusService;
    private final CouponService couponService;

    public OrderController(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository,
            DeliveryAreaRepository deliveryAreaRepository,
            StoreStatusService storeStatusService,
            CouponService couponService
    ) {
        this.orderRepository =
                orderRepository;

        this.orderItemRepository =
                orderItemRepository;

        this.productRepository =
                productRepository;

        this.deliveryAreaRepository =
                deliveryAreaRepository;

        this.storeStatusService =
                storeStatusService;

        this.couponService =
                couponService;
    }

    // =========================
    // LISTAR TODOS
    // =========================

    @GetMapping
    public List<Order> listAll() {

        return orderRepository
                .findAllByOrderByCreatedAtDesc();
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    public Order findById(
            @PathVariable Long id
    ) {

        return orderRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Pedido não encontrado"
                        )
                );
    }

    // =========================
    // LISTAR POR STATUS
    // =========================

    @GetMapping("/status/{status}")
    public List<Order> listByStatus(
            @PathVariable OrderStatus status
    ) {

        return orderRepository
                .findByStatusOrderByCreatedAtDesc(
                        status
                );
    }

    // =========================
    // CRIAR PEDIDO
    // =========================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Order create(
            @RequestBody OrderRequest request
    ) {

        // =========================
        // LOJA ABERTA
        // =========================

        if (!storeStatusService.canReceiveOrders()) {

            throw new RuntimeException(
                    "A pizzaria não está recebendo pedidos neste momento"
            );
        }

        // =========================
        // VALIDAÇÕES BÁSICAS
        // =========================

        if (request.getCustomerName() == null
                || request.getCustomerName().isBlank()) {

            throw new RuntimeException(
                    "Nome do cliente não informado"
            );
        }

        if (request.getCustomerPhone() == null
                || request.getCustomerPhone().isBlank()) {

            throw new RuntimeException(
                    "Telefone do cliente não informado"
            );
        }

        if (request.getNeighborhood() == null
                || request.getNeighborhood().isBlank()) {

            throw new RuntimeException(
                    "Bairro não informado"
            );
        }

        if (request.getItems() == null
                || request.getItems().isEmpty()) {

            throw new RuntimeException(
                    "O pedido precisa ter pelo menos um item"
            );
        }

        if (request.getPaymentMethod() == null) {

            throw new RuntimeException(
                    "Forma de pagamento não informada"
            );
        }

        // =========================
        // ÁREA DE ENTREGA
        // =========================

        DeliveryArea deliveryArea =
                deliveryAreaRepository
                        .findByNeighborhoodIgnoreCaseAndActiveTrue(
                                request
                                        .getNeighborhood()
                                        .trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Não realizamos entrega para este bairro"
                                )
                        );

        BigDecimal deliveryFee =
                deliveryArea.getFee();

        // =========================
        // CRIAR PEDIDO BASE
        // =========================

        Order order =
                new Order();

        order.setCustomerName(
                request
                        .getCustomerName()
                        .trim()
        );

        order.setCustomerPhone(
                request
                        .getCustomerPhone()
                        .trim()
        );

        order.setStreet(
                request.getStreet()
        );

        order.setNumber(
                request.getNumber()
        );

        order.setNeighborhood(
                deliveryArea
                        .getNeighborhood()
        );

        order.setComplement(
                request.getComplement()
        );

        order.setDeliveryFee(
                deliveryFee
        );

        order.setTotal(
                BigDecimal.ZERO
        );

        order.setDiscountAmount(
                BigDecimal.ZERO
        );

        order.setCouponCode(
                null
        );

        order.setCouponUsageRegistered(
                false
        );

        order.setStatus(
                OrderStatus.PENDING_PAYMENT
        );

        order.setPaymentStatus(
                PaymentStatus.PENDING
        );

        order.setPaymentMethod(
                request.getPaymentMethod()
        );

        order =
                orderRepository.save(
                        order
                );

        // =========================
        // CALCULAR PRODUTOS
        // =========================

        BigDecimal productsTotal =
                BigDecimal.ZERO;

        for (
                OrderItemRequest itemRequest :
                request.getItems()
        ) {

            Product product =
                    productRepository
                            .findById(
                                    itemRequest
                                            .getProductId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Produto não encontrado"
                                    )
                            );

            if (!product.isAvailable()) {

                throw new RuntimeException(
                        "Produto indisponível: "
                                + product.getName()
                );
            }

            if (itemRequest.getQuantity() == null
                    || itemRequest.getQuantity() <= 0) {

                throw new RuntimeException(
                        "Quantidade inválida para "
                                + product.getName()
                );
            }

            int quantity =
                    itemRequest
                            .getQuantity();

            BigDecimal subtotal =
                    product
                            .getPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            quantity
                                    )
                            );

            OrderItem item =
                    new OrderItem();

            item.setOrder(
                    order
            );

            item.setProduct(
                    product
            );

            item.setQuantity(
                    quantity
            );

            item.setUnitPrice(
                    product.getPrice()
            );

            item.setObservation(
                    itemRequest
                            .getObservation()
            );

            orderItemRepository.save(
                    item
            );

            productsTotal =
                    productsTotal.add(
                            subtotal
                    );
        }

        // =========================
        // TOTAL ANTES DO CUPOM
        // =========================

        BigDecimal orderValueBeforeDiscount =
                productsTotal.add(
                        deliveryFee
                );

        // =========================
        // CUPOM
        // =========================

        BigDecimal discountAmount =
                BigDecimal.ZERO;

        String couponCode =
                request.getCouponCode();

        if (couponCode != null
                && !couponCode.isBlank()) {

            Coupon coupon =
                    couponService
                            .validateForOrder(
                                    couponCode,
                                    orderValueBeforeDiscount
                            );

            discountAmount =
                    couponService
                            .calculateDiscount(
                                    coupon,
                                    orderValueBeforeDiscount
                            );

            order.setCouponCode(
                    coupon.getCode()
            );

            order.setDiscountAmount(
                    discountAmount
            );
        }

        // =========================
        // TOTAL FINAL
        // =========================

        BigDecimal finalTotal =
                orderValueBeforeDiscount
                        .subtract(
                                discountAmount
                        );

        if (finalTotal.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            finalTotal =
                    BigDecimal.ZERO;
        }

        finalTotal =
                finalTotal.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        order.setTotal(
                finalTotal
        );

        /*
         * IMPORTANTE:
         *
         * O uso do cupom NÃO é registrado aqui.
         *
         * O pedido pode ser criado e o cliente
         * abandonar o pagamento.
         *
         * O usageCount será incrementado somente
         * quando o pagamento for APPROVED.
         */

        return orderRepository.save(
                order
        );
    }

    // =========================
    // ITENS DO PEDIDO
    // =========================

    @GetMapping("/{id}/items")
    public List<OrderItem> listItems(
            @PathVariable Long id
    ) {

        orderRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Pedido não encontrado"
                        )
                );

        return orderItemRepository
                .findByOrderId(
                        id
                );
    }

    // =========================
    // ALTERAR STATUS
    // =========================

    @PatchMapping("/{id}/status")
    public Order changeStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {

        Order order =
                orderRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Pedido não encontrado"
                                )
                        );

        order.setStatus(
                status
        );

        return orderRepository.save(
                order
        );
    }
}