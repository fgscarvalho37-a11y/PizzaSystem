package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(
                        name = "idx_orders_public_access_token",
                        columnList = "public_access_token"
                ),
                @Index(
                        name = "idx_orders_store_id",
                        columnList = "store_id"
                ),
                @Index(
                        name = "idx_orders_customer_id",
                        columnList = "customer_id"
                )
        }
)
public class Order {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    // =========================
    // LOJA / TENANT
    // =========================

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    // =========================
    // CONTA DO CLIENTE
    // =========================

    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "customer_id"
    )
    private Customer customer;

    // =========================
    // TOKEN PÚBLICO DO PEDIDO
    // =========================

    @Column(
            name = "public_access_token",
            unique = true,
            length = 36
    )
    private String publicAccessToken;

    // =========================
    // CLIENTE - SNAPSHOT
    // =========================

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    // =========================
    // ENTREGA
    // =========================

    private String street;

    private String number;

    private String city;

    private String neighborhood;

    private String complement;

    private BigDecimal deliveryFee;

    @Column(
            name = "delivery_distance_km",
            precision = 8,
            scale = 2
    )
    private BigDecimal deliveryDistanceKm;

    @Column(
            name = "delivery_route_provider",
            length = 40
    )
    private String deliveryRouteProvider;

    @Column(
            name = "delivery_route_url",
            length = 1200
    )
    private String deliveryRouteUrl;

    // =========================
    // VALORES
    // =========================

    private BigDecimal total;

    private String couponCode;

    @Column(
            nullable = false,
            precision = 12,
            scale = 2
    )
    private BigDecimal discountAmount =
            BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean couponUsageRegistered =
            false;

    // =========================
    // FIDELIDADE
    // =========================

    /*
     * Impede que o mesmo pedido
     * gere pontos/selos mais de uma vez.
     */
    @Column(nullable = false)
    private boolean loyaltyRegistered =
            false;

    // =========================
    // STATUS
    // =========================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status =
            OrderStatus.PENDING_PAYMENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus =
            PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    // =========================
    // PAGAMENTO EXTERNO
    // =========================

    private String paymentExternalId;

    // =========================
    // DATA
    // =========================

    @Column(nullable = false)
    private LocalDateTime createdAt =
            LocalDateTime.now();

    public Order() {
    }

    // =========================
    // GERAR TOKEN
    // =========================

    @PrePersist
    @PreUpdate
    private void ensurePublicAccessToken() {

        if (publicAccessToken == null
                || publicAccessToken.isBlank()) {

            publicAccessToken =
                    UUID.randomUUID()
                            .toString();
        }
    }

    // =========================
    // GETTERS / SETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(
            Store store
    ) {
        this.store =
                store;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(
            Customer customer
    ) {
        this.customer =
                customer;
    }

    public String getPublicAccessToken() {
        return publicAccessToken;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(
            String customerName
    ) {
        this.customerName =
                customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(
            String customerPhone
    ) {
        this.customerPhone =
                customerPhone;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(
            String street
    ) {
        this.street =
                street;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(
            String number
    ) {
        this.number =
                number;
    }

    public String getCity() {
        return city;
    }

    public void setCity(
            String city
    ) {
        this.city =
                city;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public void setNeighborhood(
            String neighborhood
    ) {
        this.neighborhood =
                neighborhood;
    }

    public String getComplement() {
        return complement;
    }

    public void setComplement(
            String complement
    ) {
        this.complement =
                complement;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(
            BigDecimal deliveryFee
    ) {
        this.deliveryFee =
                deliveryFee;
    }

    public BigDecimal getDeliveryDistanceKm() {
        return deliveryDistanceKm;
    }

    public void setDeliveryDistanceKm(
            BigDecimal deliveryDistanceKm
    ) {
        this.deliveryDistanceKm =
                deliveryDistanceKm;
    }

    public String getDeliveryRouteProvider() {
        return deliveryRouteProvider;
    }

    public void setDeliveryRouteProvider(
            String deliveryRouteProvider
    ) {
        this.deliveryRouteProvider =
                deliveryRouteProvider;
    }

    public String getDeliveryRouteUrl() {
        return deliveryRouteUrl;
    }

    public void setDeliveryRouteUrl(
            String deliveryRouteUrl
    ) {
        this.deliveryRouteUrl =
                deliveryRouteUrl;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(
            BigDecimal total
    ) {
        this.total =
                total;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(
            String couponCode
    ) {
        this.couponCode =
                couponCode;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(
            BigDecimal discountAmount
    ) {
        this.discountAmount =
                discountAmount;
    }

    public boolean isCouponUsageRegistered() {
        return couponUsageRegistered;
    }

    public void setCouponUsageRegistered(
            boolean couponUsageRegistered
    ) {
        this.couponUsageRegistered =
                couponUsageRegistered;
    }

    public boolean isLoyaltyRegistered() {
        return loyaltyRegistered;
    }

    public void setLoyaltyRegistered(
            boolean loyaltyRegistered
    ) {
        this.loyaltyRegistered =
                loyaltyRegistered;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(
            OrderStatus status
    ) {
        this.status =
                status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(
            PaymentStatus paymentStatus
    ) {
        this.paymentStatus =
                paymentStatus;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {
        this.paymentMethod =
                paymentMethod;
    }

    public String getPaymentExternalId() {
        return paymentExternalId;
    }

    public void setPaymentExternalId(
            String paymentExternalId
    ) {
        this.paymentExternalId =
                paymentExternalId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}