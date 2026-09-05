package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.OrderItemRequest;
import com.pizzasystem.backend.dto.OrderRequest;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderItem;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.Product;
import com.pizzasystem.backend.repository.OrderItemRepository;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    public OrderController(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductRepository productRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    // LISTAR TODOS OS PEDIDOS
    @GetMapping
    public List<Order> listAll() {
        return orderRepository.findAll();
    }

    // BUSCAR PEDIDO POR ID
    @GetMapping("/{id}")
    public Order findById(@PathVariable Long id) {

        return orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Pedido não encontrado"));
    }

    // CRIAR PEDIDO
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Order create(@RequestBody OrderRequest request) {

        Order order = new Order();

        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setStreet(request.getStreet());
        order.setNumber(request.getNumber());
        order.setNeighborhood(request.getNeighborhood());
        order.setComplement(request.getComplement());

        BigDecimal deliveryFee =
                request.getDeliveryFee() != null
                        ? request.getDeliveryFee()
                        : BigDecimal.ZERO;

        order.setDeliveryFee(deliveryFee);
        order.setTotal(BigDecimal.ZERO);

        order = orderRepository.save(order);

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {

            Product product = productRepository
                    .findById(itemRequest.getProductId())
                    .orElseThrow(() ->
                            new RuntimeException("Produto não encontrado"));

            if (!product.isAvailable()) {
                throw new RuntimeException(
                        "Produto indisponível: " + product.getName()
                );
            }

            int quantity = itemRequest.getQuantity();

            BigDecimal subtotal =
                    product.getPrice()
                            .multiply(BigDecimal.valueOf(quantity));

            OrderItem item = new OrderItem();

            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(quantity);
            item.setUnitPrice(product.getPrice());
            item.setObservation(itemRequest.getObservation());

            orderItemRepository.save(item);

            total = total.add(subtotal);
        }

        total = total.add(deliveryFee);

        order.setTotal(total);

        return orderRepository.save(order);
    }

    // LISTAR ITENS DE UM PEDIDO
    @GetMapping("/{id}/items")
    public List<OrderItem> listItems(@PathVariable Long id) {

        orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Pedido não encontrado"));

        return orderItemRepository.findByOrderId(id);
    }

    // ALTERAR STATUS DO PEDIDO
    @PatchMapping("/{id}/status")
    public Order changeStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    ) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Pedido não encontrado"));

        order.setStatus(status);

        return orderRepository.save(order);
    }
    
}