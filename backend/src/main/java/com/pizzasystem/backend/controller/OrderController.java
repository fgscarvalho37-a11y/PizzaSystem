package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.OrderItemRequest;
import com.pizzasystem.backend.dto.OrderRequest;

import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderItem;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.CrustRepository;
import com.pizzasystem.backend.repository.DeliveryAreaRepository;
import com.pizzasystem.backend.repository.OrderItemRepository;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.ProductRepository;

import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.PublicStoreService;
import com.pizzasystem.backend.service.StoreStatusService;

import org.springframework.http.HttpStatus;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final DeliveryAreaRepository deliveryAreaRepository;
    private final StoreStatusService storeStatusService;
    private final CouponService couponService;
    private final CrustRepository crustRepository;
    private final PublicStoreService publicStoreService;
    private final CurrentStoreService currentStoreService;

    public OrderController(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository,
            DeliveryAreaRepository deliveryAreaRepository,
            StoreStatusService storeStatusService,
            CouponService couponService,
            CrustRepository crustRepository,
            PublicStoreService publicStoreService,
            CurrentStoreService currentStoreService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.deliveryAreaRepository = deliveryAreaRepository;
        this.storeStatusService = storeStatusService;
        this.couponService = couponService;
        this.crustRepository = crustRepository;
        this.publicStoreService = publicStoreService;
        this.currentStoreService = currentStoreService;
    }

    // =========================
    // LISTAR TODOS - ADMIN
    // =========================

    @GetMapping
    @Transactional(readOnly = true)
    public List<Order> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return orderRepository
                .findByStoreIdOrderByCreatedAtDesc(
                        storeId
                );
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public Order findById(
            @PathVariable Long id,
            @RequestParam(required = false) String token
    ) {

        return getOrderForAccess(
                id,
                token
        );
    }

    // =========================
    // LISTAR POR STATUS - ADMIN
    // =========================

    @GetMapping("/status/{status}")
    @Transactional(readOnly = true)
    public List<Order> listByStatus(
            @PathVariable OrderStatus status
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return orderRepository
                .findByStoreIdAndStatusOrderByCreatedAtDesc(
                        storeId,
                        status
                );
    }

    // =========================
    // CRIAR PEDIDO - PÚBLICO
    // =========================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Order create(
            @RequestBody OrderRequest request
    ) {

        if (request.getStoreSlug() == null
                || request.getStoreSlug().isBlank()) {

            throw new RuntimeException(
                    "Loja não informada"
            );
        }

        Store store =
                publicStoreService
                        .getBySlug(
                                request
                                        .getStoreSlug()
                                        .trim()
                        );

        if (!store.isActive()) {

            throw new RuntimeException(
                    "Esta loja não está disponível"
            );
        }

        if (!storeStatusService
                .canReceiveOrders(store)) {

            throw new RuntimeException(
                    "A pizzaria não está recebendo pedidos neste momento"
            );
        }

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

        DeliveryArea deliveryArea =
                deliveryAreaRepository
                        .findByStoreIdAndNeighborhoodIgnoreCaseAndActiveTrue(
                                store.getId(),
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

        if (deliveryFee == null) {
            deliveryFee = BigDecimal.ZERO;
        }

        Order order =
                new Order();

        order.setStore(store);

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
                deliveryArea.getNeighborhood()
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

        order.setCouponCode(null);

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

        BigDecimal productsTotal =
                BigDecimal.ZERO;

        for (OrderItemRequest itemRequest
                : request.getItems()) {

            Product product =
                    productRepository
                            .findByIdAndStoreId(
                                    itemRequest.getProductId(),
                                    store.getId()
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
                    itemRequest.getQuantity();

            BigDecimal unitPrice =
                    product.getPrice();

            if (unitPrice == null) {

                throw new RuntimeException(
                        "Produto sem preço cadastrado: "
                                + product.getName()
                );
            }

            String crustName =
                    null;

            BigDecimal crustPrice =
                    null;

            if (itemRequest.getCrustId() != null) {

                if (!product.isAllowCrust()) {

                    throw new RuntimeException(
                            "O produto "
                                    + product.getName()
                                    + " não aceita borda recheada"
                    );
                }

                Crust crust =
                        crustRepository
                                .findByIdAndStoreId(
                                        itemRequest.getCrustId(),
                                        store.getId()
                                )
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Borda não encontrada"
                                        )
                                );

                if (!crust.isActive()) {

                    throw new RuntimeException(
                            "Borda indisponível: "
                                    + crust.getName()
                    );
                }

                crustName =
                        crust.getName();

                crustPrice =
                        crust.getPrice();

                if (crustPrice == null) {
                    crustPrice =
                            BigDecimal.ZERO;
                }

                unitPrice =
                        unitPrice.add(
                                crustPrice
                        );
            }

            BigDecimal subtotal =
                    unitPrice.multiply(
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
                    unitPrice
            );

            item.setCrustName(
                    crustName
            );

            item.setCrustPrice(
                    crustPrice
            );

            item.setObservation(
                    itemRequest.getObservation()
            );

            orderItemRepository.save(
                    item
            );

            productsTotal =
                    productsTotal.add(
                            subtotal
                    );
        }

        BigDecimal orderValueBeforeDiscount =
                productsTotal.add(
                        deliveryFee
                );

        BigDecimal discountAmount =
                BigDecimal.ZERO;

        String couponCode =
                request.getCouponCode();

        if (couponCode != null
                && !couponCode.isBlank()) {

            Coupon coupon =
                    couponService
                            .validateForOrder(
                                    store,
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

        return orderRepository.save(
                order
        );
    }

    // =========================
    // ITENS DO PEDIDO
    // =========================

    @GetMapping("/{id}/items")
    @Transactional(readOnly = true)
    public List<OrderItem> listItems(
            @PathVariable Long id,
            @RequestParam(required = false) String token
    ) {

        getOrderForAccess(
                id,
                token
        );

        return orderItemRepository
                .findByOrderId(
                        id
                );
    }

    // =========================
    // ALTERAR STATUS - ADMIN
    // =========================

    @PatchMapping("/{id}/status")
    @Transactional
    public Order changeStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        Order order =
                orderRepository
                        .findByIdAndStoreId(
                                id,
                                storeId
                        )
                        .orElseThrow(
                                this::orderNotFound
                        );

        order.setStatus(
                status
        );

        return orderRepository.save(
                order
        );
    }

    // =========================
    // ACESSO AO PEDIDO
    // =========================

    private Order getOrderForAccess(
            Long id,
            String token
    ) {

        if (isAdminAuthenticated()) {

            Long storeId =
                    currentStoreService
                            .getCurrentStoreId();

            return orderRepository
                    .findByIdAndStoreId(
                            id,
                            storeId
                    )
                    .orElseThrow(
                            this::orderNotFound
                    );
        }

        if (token == null
                || token.isBlank()) {

            throw orderNotFound();
        }

        return orderRepository
                .findByIdAndPublicAccessToken(
                        id,
                        token.trim()
                )
                .orElseThrow(
                        this::orderNotFound
                );
    }

    private boolean isAdminAuthenticated() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return false;
        }

        return authentication
                .getAuthorities()
                .stream()
                .anyMatch(
                        authority ->
                                "ROLE_ADMIN".equals(
                                        authority.getAuthority()
                                )
                );
    }

    private ResponseStatusException orderNotFound() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pedido não encontrado"
        );
    }
}