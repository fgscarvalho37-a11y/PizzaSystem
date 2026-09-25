package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;
import com.pizzasystem.backend.dto.OrderItemRequest;
import com.pizzasystem.backend.dto.OrderRequest;

import com.pizzasystem.backend.entity.Addon;
import com.pizzasystem.backend.entity.AddonGroup;
import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.Crust;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderItem;
import com.pizzasystem.backend.entity.OrderItemAddon;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.AddonRepository;
import com.pizzasystem.backend.repository.CrustRepository;
import com.pizzasystem.backend.repository.CustomerRepository;
import com.pizzasystem.backend.repository.OrderItemRepository;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.ProductRepository;

import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.DeliveryQuoteService;
import com.pizzasystem.backend.service.PublicStoreService;
import com.pizzasystem.backend.service.StoreStatusService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository
            orderRepository;

    private final OrderItemRepository
            orderItemRepository;

    private final ProductRepository
            productRepository;

    private final DeliveryQuoteService
            deliveryQuoteService;

    private final StoreStatusService
            storeStatusService;

    private final CouponService
            couponService;

    private final CrustRepository
            crustRepository;

    private final AddonRepository
            addonRepository;

    private final PublicStoreService
            publicStoreService;

    private final CurrentStoreService
            currentStoreService;

    private final CustomerRepository
            customerRepository;

    private static final String SESSION_CUSTOMER_ID =
            "CUSTOMER_ID";

    public OrderController(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository,
            DeliveryQuoteService deliveryQuoteService,
            StoreStatusService storeStatusService,
            CouponService couponService,
            CrustRepository crustRepository,
            AddonRepository addonRepository,
            PublicStoreService publicStoreService,
            CurrentStoreService currentStoreService,
            CustomerRepository customerRepository
    ) {

        this.orderRepository =
                orderRepository;

        this.orderItemRepository =
                orderItemRepository;

        this.productRepository =
                productRepository;

        this.deliveryQuoteService =
                deliveryQuoteService;

        this.storeStatusService =
                storeStatusService;

        this.couponService =
                couponService;

        this.crustRepository =
                crustRepository;

        this.addonRepository =
                addonRepository;

        this.publicStoreService =
                publicStoreService;

        this.currentStoreService =
                currentStoreService;

        this.customerRepository =
                customerRepository;
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
    @ResponseStatus(
            HttpStatus.CREATED
    )
    @Transactional
    public Order create(
            @RequestBody OrderRequest request,
            HttpServletRequest servletRequest
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
                .canReceiveOrders(
                        store
                )) {

            throw new RuntimeException(
                    "O estabelecimento não está recebendo pedidos neste momento"
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

        if (request.getCity() == null
                || request.getCity().isBlank()) {

            throw new RuntimeException(
                    "Cidade não informada"
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

        if (
                request.getStreet() == null ||
                request.getStreet().isBlank()
        ) {

            throw new RuntimeException(
                    "Rua não informada"
            );
        }

        if (
                request.getNumber() == null ||
                request.getNumber().isBlank()
        ) {

            throw new RuntimeException(
                    "Número não informado"
            );
        }

        Order order =
                new Order();

        order.setStore(
                store
        );

        // =========================
        // CONTA DO CLIENTE
        // =========================

        HttpSession customerSession =
                servletRequest
                        .getSession(
                                false
                        );

        if (customerSession != null) {

            Object customerIdObject =
                    customerSession
                            .getAttribute(
                                    SESSION_CUSTOMER_ID
                            );

            if (customerIdObject
                    instanceof Long customerId) {

                Customer customer =
                        customerRepository
                                .findById(
                                        customerId
                                )
                                .orElse(
                                        null
                                );

                if (customer != null
                        && customer.isActive()) {

                    order.setCustomer(
                            customer
                    );

                } else {

                    customerSession
                            .removeAttribute(
                                    SESSION_CUSTOMER_ID
                            );

                    customerSession
                            .removeAttribute(
                                    "CUSTOMER_EMAIL"
                            );
                }
            }
        }

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

        order.setCity(
                request
                        .getCity()
                        .trim()
        );

        order.setNeighborhood(
                request
                        .getNeighborhood()
                        .trim()
        );

        order.setComplement(
                request.getComplement()
        );

        order.setDeliveryFee(
                BigDecimal.ZERO
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        )
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
                orderRepository
                        .save(
                                order
                        );

        BigDecimal productsTotal =
                BigDecimal.ZERO;

        // =========================
        // ITENS
        // =========================

        for (
                OrderItemRequest itemRequest
                : request.getItems()
        ) {

            Product product =
                    productRepository
                            .findByIdAndStoreId(
                                    itemRequest
                                            .getProductId(),
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
                    itemRequest
                            .getQuantity();

            BigDecimal unitPrice =
                    product
                            .getPrice();

            if (unitPrice == null) {

                throw new RuntimeException(
                        "Produto sem preço cadastrado: "
                                + product.getName()
                );
            }

            unitPrice =
                    normalizeMoney(
                            unitPrice
                    );

            // =========================
            // ADICIONAIS
            // =========================

            Set<AddonGroup> productGroups =
                    product
                            .getAddonGroups() != null
                            ? product.getAddonGroups()
                            : new LinkedHashSet<>();

            Map<Long, AddonGroup>
                    activeGroupsById =
                    new HashMap<>();

            for (
                    AddonGroup group
                    : productGroups
            ) {

                if (group == null
                        || group.getId() == null
                        || !group.isActive()) {

                    continue;
                }

                activeGroupsById.put(
                        group.getId(),
                        group
                );
            }

            /*
             * HashSet também impede que o
             * mesmo adicional seja enviado
             * várias vezes no mesmo item.
             */
            Set<Long> requestedAddonIds =
                    new LinkedHashSet<>();

            if (itemRequest
                    .getAddonIds() != null) {

                for (
                        Long addonId
                        : itemRequest
                        .getAddonIds()
                ) {

                    if (addonId != null) {

                        requestedAddonIds.add(
                                addonId
                        );
                    }
                }
            }

            if (!requestedAddonIds.isEmpty()
                    && activeGroupsById.isEmpty()) {

                throw new RuntimeException(
                        "O produto "
                                + product.getName()
                                + " não possui grupos de adicionais disponíveis"
                );
            }

            Map<Long, Integer>
                    selectionsByGroup =
                    new HashMap<>();

            List<Addon>
                    selectedAddons =
                    new java.util.ArrayList<>();

            for (
                    Long addonId
                    : requestedAddonIds
            ) {

                Addon addon =
                        addonRepository
                                .findByIdAndStoreId(
                                        addonId,
                                        store.getId()
                                )
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Adicional não encontrado"
                                        )
                                );

                if (!addon.isActive()) {

                    throw new RuntimeException(
                            "Adicional indisponível: "
                                    + addon.getName()
                    );
                }

                AddonGroup group =
                        addon.getGroup();

                if (group == null
                        || group.getId() == null) {

                    throw new RuntimeException(
                            "Grupo do adicional inválido"
                    );
                }

                if (!group.isActive()) {

                    throw new RuntimeException(
                            "O grupo "
                                    + group.getName()
                                    + " não está disponível"
                    );
                }

                if (!activeGroupsById
                        .containsKey(
                                group.getId()
                        )) {

                    throw new RuntimeException(
                            "O adicional "
                                    + addon.getName()
                                    + " não está disponível para "
                                    + product.getName()
                    );
                }

                int currentCount =
                        selectionsByGroup
                                .getOrDefault(
                                        group.getId(),
                                        0
                                );

                selectionsByGroup.put(
                        group.getId(),
                        currentCount + 1
                );

                selectedAddons.add(
                        addon
                );
            }

            // =========================
            // MÍNIMO / MÁXIMO
            // =========================

            for (
                    AddonGroup group
                    : activeGroupsById.values()
            ) {

                int selectedCount =
                        selectionsByGroup
                                .getOrDefault(
                                        group.getId(),
                                        0
                                );

                if (selectedCount
                        < group.getMinSelections()) {

                    throw new RuntimeException(
                            "Selecione pelo menos "
                                    + group.getMinSelections()
                                    + " opção(ões) em "
                                    + group.getName()
                    );
                }

                if (selectedCount
                        > group.getMaxSelections()) {

                    throw new RuntimeException(
                            "Selecione no máximo "
                                    + group.getMaxSelections()
                                    + " opção(ões) em "
                                    + group.getName()
                    );
                }
            }

            // =========================
            // BORDA LEGADA
            // =========================

            String crustName =
                    null;

            BigDecimal crustPrice =
                    null;

            if (itemRequest
                    .getCrustId() != null) {

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
                                        itemRequest
                                                .getCrustId(),
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

                crustPrice =
                        normalizeMoney(
                                crustPrice
                        );

                unitPrice =
                        unitPrice.add(
                                crustPrice
                        );
            }

            // =========================
            // PREÇO DOS ADICIONAIS
            // =========================

            for (
                    Addon addon
                    : selectedAddons
            ) {

                BigDecimal addonPrice =
                        addon.getPrice();

                if (addonPrice == null) {

                    addonPrice =
                            BigDecimal.ZERO;
                }

                addonPrice =
                        normalizeMoney(
                                addonPrice
                        );

                unitPrice =
                        unitPrice.add(
                                addonPrice
                        );
            }

            unitPrice =
                    normalizeMoney(
                            unitPrice
                    );

            BigDecimal subtotal =
                    unitPrice
                            .multiply(
                                    BigDecimal.valueOf(
                                            quantity
                                    )
                            );

            subtotal =
                    normalizeMoney(
                            subtotal
                    );

            // =========================
            // CRIAR ITEM
            // =========================

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
                    normalizeNullable(
                            itemRequest
                                    .getObservation()
                    )
            );

            // =========================
            // SNAPSHOT DOS ADICIONAIS
            // =========================

            for (
                    Addon addon
                    : selectedAddons
            ) {

                AddonGroup group =
                        addon.getGroup();

                BigDecimal addonPrice =
                        addon.getPrice() != null
                                ? normalizeMoney(
                                        addon.getPrice()
                                )
                                : BigDecimal.ZERO
                                        .setScale(
                                                2,
                                                RoundingMode.HALF_UP
                                        );

                OrderItemAddon
                        orderItemAddon =
                        new OrderItemAddon();

                orderItemAddon
                        .setSourceAddonId(
                                addon.getId()
                        );

                orderItemAddon
                        .setGroupName(
                                group.getName()
                        );

                orderItemAddon
                        .setAddonName(
                                addon.getName()
                        );

                orderItemAddon
                        .setAddonPrice(
                                addonPrice
                        );

                /*
                 * Grupo primeiro,
                 * adicional depois.
                 */
                int snapshotSortOrder =
                        (
                                group.getSortOrder()
                                        * 1000
                        )
                                + addon
                                .getSortOrder();

                orderItemAddon
                        .setSortOrder(
                                snapshotSortOrder
                        );

                item.addAddon(
                        orderItemAddon
                );
            }

            /*
             * CascadeType.ALL salva também
             * os OrderItemAddon.
             */
            orderItemRepository
                    .save(
                            item
                    );

            productsTotal =
                    productsTotal.add(
                            subtotal
                    );
        }

        // =========================
        // ENTREGA POR KM
        // =========================

        DeliveryQuoteResponse deliveryQuote =
                deliveryQuoteService
                        .quote(
                                store,
                                new DeliveryQuoteRequest(
                                        request.getStreet(),
                                        request.getNumber(),
                                        request.getCity(),
                                        request.getNeighborhood(),
                                        request.getComplement(),
                                        productsTotal
                                )
                        );

        BigDecimal deliveryFee =
                deliveryQuote.fee();

        order.setDeliveryFee(
                deliveryFee
        );

        // =========================
        // CUPOM
        // =========================

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
                normalizeMoney(
                        finalTotal
                );

        order.setTotal(
                finalTotal
        );

        return orderRepository
                .save(
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

        return orderRepository
                .save(
                        order
                );
    }

    // =========================
    // CANCELAR PEDIDO
    // =========================

    @PatchMapping("/{id}/cancel")
    @Transactional
    public Order cancel(
            @PathVariable Long id,
            @RequestParam(required = false) String token
    ) {

        Order order =
                getOrderForAccess(
                        id,
                        token
                );

        if (order.getPaymentStatus()
                == PaymentStatus.APPROVED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pedido já pago não pode ser cancelado por aqui"
            );
        }

        if (order.getStatus()
                == OrderStatus.DELIVERED) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Pedido já entregue não pode ser cancelado"
            );
        }

        if (order.getStatus()
                == OrderStatus.CANCELLED) {

            return order;
        }

        if (!isAdminAuthenticated()
                && order.getStatus()
                != OrderStatus.PENDING_PAYMENT) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este pedido não pode mais ser cancelado pelo cliente"
            );
        }

        order.setStatus(
                OrderStatus.CANCELLED
        );

        return orderRepository
                .save(
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
                                "ROLE_ADMIN"
                                        .equals(
                                                authority
                                                        .getAuthority()
                                        )
                );
    }

    private ResponseStatusException orderNotFound() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pedido não encontrado"
        );
    }

    // =========================
    // NORMALIZAR DINHEIRO
    // =========================

    private BigDecimal normalizeMoney(
            BigDecimal value
    ) {

        return value
                .setScale(
                        2,
                        RoundingMode.HALF_UP
                );
    }

    // =========================
    // STRING OPCIONAL
    // =========================

    private String normalizeNullable(
            String value
    ) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value
                .trim();
    }
}