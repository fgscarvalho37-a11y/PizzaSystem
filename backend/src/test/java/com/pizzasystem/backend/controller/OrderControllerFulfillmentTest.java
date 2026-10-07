package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;
import com.pizzasystem.backend.dto.OrderItemRequest;
import com.pizzasystem.backend.dto.OrderRequest;
import com.pizzasystem.backend.entity.FulfillmentType;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.PaymentTiming;
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
import com.pizzasystem.backend.service.PayPalStorePaymentService;
import com.pizzasystem.backend.service.PublicStoreService;
import com.pizzasystem.backend.service.StoreStatusService;
import com.pizzasystem.backend.service.StripeStorePaymentService;

import jakarta.servlet.http.HttpServletRequest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OrderControllerFulfillmentTest {

    private OrderRepository orderRepository;
    private OrderItemRepository orderItemRepository;
    private ProductRepository productRepository;
    private DeliveryQuoteService deliveryQuoteService;
    private StoreStatusService storeStatusService;
    private PublicStoreService publicStoreService;
    private OrderController controller;
    private Store store;

    @BeforeEach
    void setUp() {
        orderRepository =
                mock(OrderRepository.class);
        orderItemRepository =
                mock(OrderItemRepository.class);
        productRepository =
                mock(ProductRepository.class);
        deliveryQuoteService =
                mock(DeliveryQuoteService.class);
        storeStatusService =
                mock(StoreStatusService.class);
        CouponService couponService =
                mock(CouponService.class);
        CrustRepository crustRepository =
                mock(CrustRepository.class);
        AddonRepository addonRepository =
                mock(AddonRepository.class);
        publicStoreService =
                mock(PublicStoreService.class);
        CurrentStoreService currentStoreService =
                mock(CurrentStoreService.class);
        CustomerRepository customerRepository =
                mock(CustomerRepository.class);
        StripeStorePaymentService stripeStorePaymentService =
                mock(StripeStorePaymentService.class);
        PayPalStorePaymentService payPalStorePaymentService =
                mock(PayPalStorePaymentService.class);

        controller =
                new OrderController(
                        orderRepository,
                        orderItemRepository,
                        productRepository,
                        deliveryQuoteService,
                        storeStatusService,
                        couponService,
                        crustRepository,
                        addonRepository,
                        publicStoreService,
                        currentStoreService,
                        customerRepository,
                        stripeStorePaymentService,
                        payPalStorePaymentService
                );

        store =
                mock(Store.class);

        when(
                store.getId()
        ).thenReturn(
                9L
        );
        when(
                store.isActive()
        ).thenReturn(
                true
        );
        when(
                storeStatusService
                        .canReceiveOrders(
                                store
                        )
        ).thenReturn(
                true
        );
        when(
                store.isDeliveryEnabled()
        ).thenReturn(
                true
        );
        when(
                store.isPickupEnabled()
        ).thenReturn(
                true
        );
        when(
                store.isPickupOnlinePaymentEnabled()
        ).thenReturn(
                true
        );
        when(
                store.isPickupPayAtStoreEnabled()
        ).thenReturn(
                true
        );
        when(
                store.getDeliveryOriginAddress()
        ).thenReturn(
                "Rua da Loja, 100"
        );
        when(
                store.getPickupPreparationMinutes()
        ).thenReturn(
                25
        );
        when(
                store.getCountryCode()
        ).thenReturn(
                "BR"
        );
        when(
                store.getCurrencyCode()
        ).thenReturn(
                "BRL"
        );

        when(
                publicStoreService
                        .getBySlug(
                                "test-store"
                        )
        ).thenReturn(
                store
        );

        Product product =
                mock(Product.class);

        when(
                product.isAvailable()
        ).thenReturn(
                true
        );
        when(
                product.getName()
        ).thenReturn(
                "Pizza Teste"
        );
        when(
                product.getPrice()
        ).thenReturn(
                new BigDecimal(
                        "50.00"
                )
        );
        when(
                product.getAddonGroups()
        ).thenReturn(
                Set.of()
        );
        when(
                product.isAllowCrust()
        ).thenReturn(
                false
        );

        when(
                productRepository
                        .findByIdAndStoreId(
                                1L,
                                9L
                        )
        ).thenReturn(
                Optional.of(
                        product
                )
        );

        when(
                orderRepository
                        .save(
                                any(
                                        Order.class
                                )
                        )
        ).thenAnswer(
                invocation ->
                        invocation.getArgument(
                                0
                        )
        );
    }

    @Test
    void pickupPayAtStoreSkipsDeliveryQuoteAndFee() {
        OrderRequest request =
                baseRequest();

        request.setFulfillmentType(
                FulfillmentType.PICKUP
        );
        request.setPaymentTiming(
                PaymentTiming.ON_PICKUP
        );
        request.setPaymentMethod(
                null
        );

        HttpServletRequest servletRequest =
                mock(
                        HttpServletRequest.class
                );

        when(
                servletRequest.getSession(
                        false
                )
        ).thenReturn(
                null
        );

        Order order =
                controller.create(
                        request,
                        servletRequest
                );

        assertEquals(
                FulfillmentType.PICKUP,
                order.getFulfillmentType()
        );
        assertEquals(
                PaymentTiming.ON_PICKUP,
                order.getPaymentTiming()
        );
        assertEquals(
                OrderStatus.RECEIVED,
                order.getStatus()
        );
        assertEquals(
                PaymentStatus.PENDING,
                order.getPaymentStatus()
        );
        assertEquals(
                new BigDecimal(
                        "0.00"
                ),
                order.getDeliveryFee()
        );
        assertEquals(
                new BigDecimal(
                        "50.00"
                ),
                order.getTotal()
        );
        assertEquals(
                25,
                order.getPickupEstimatedMinutes()
        );
        assertNull(
                order.getStreet()
        );

        verifyNoInteractions(
                deliveryQuoteService
        );
    }

    @Test
    void legacyDeliveryStillUsesDeliveryQuote() {
        OrderRequest request =
                baseRequest();

        request.setPaymentMethod(
                PaymentMethod.CASH
        );
        request.setStreet(
                "Rua Cliente"
        );
        request.setNumber(
                "10"
        );
        request.setCity(
                "Jaguariuna"
        );
        request.setNeighborhood(
                "Centro"
        );
        request.setPostalCode(
                "13820000"
        );

        when(
                deliveryQuoteService
                        .quote(
                                eq(
                                        store
                                ),
                                any(
                                        DeliveryQuoteRequest.class
                                )
                        )
        ).thenReturn(
                new DeliveryQuoteResponse(
                        "PER_KM",
                        new BigDecimal(
                                "3.00"
                        ),
                        new BigDecimal(
                                "2.00"
                        ),
                        new BigDecimal(
                                "6.00"
                        ),
                        "Jaguariuna",
                        "Centro",
                        false,
                        null,
                        null,
                        "mapbox",
                        null,
                        null,
                        null,
                        null,
                        null
                )
        );

        HttpServletRequest servletRequest =
                mock(
                        HttpServletRequest.class
                );

        when(
                servletRequest.getSession(
                        false
                )
        ).thenReturn(
                null
        );

        Order order =
                controller.create(
                        request,
                        servletRequest
                );

        assertEquals(
                FulfillmentType.DELIVERY,
                order.getFulfillmentType()
        );
        assertEquals(
                PaymentTiming.ONLINE,
                order.getPaymentTiming()
        );
        assertEquals(
                new BigDecimal(
                        "6.00"
                ),
                order.getDeliveryFee()
        );
        assertEquals(
                new BigDecimal(
                        "56.00"
                ),
                order.getTotal()
        );
        assertEquals(
                "Rua Cliente",
                order.getStreet()
        );

        verify(
                deliveryQuoteService,
                times(
                        1
                )
        ).quote(
                eq(
                        store
                ),
                any(
                        DeliveryQuoteRequest.class
                )
        );
    }

    private OrderRequest baseRequest() {
        OrderItemRequest item =
                new OrderItemRequest();

        item.setProductId(
                1L
        );
        item.setQuantity(
                1
        );

        OrderRequest request =
                new OrderRequest();

        request.setStoreSlug(
                "test-store"
        );
        request.setCustomerName(
                "Cliente Teste"
        );
        request.setCustomerPhone(
                "11999999999"
        );
        request.setItems(
                List.of(
                        item
                )
        );

        return request;
    }
}
