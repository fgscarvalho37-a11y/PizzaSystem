package com.pizzasystem.backend.dto;

import com.pizzasystem.backend.entity.PaymentMethod;

import java.util.List;

public class OrderRequest {

    // =========================
    // LOJA / TENANT
    // =========================

    /*
     * Slug público da loja responsável
     * por receber este pedido.
     *
     * Exemplo:
     * misterio-do-sabor
     */
    private String storeSlug;

    // =========================
    // CLIENTE
    // =========================

    private String customerName;

    private String customerPhone;

    // =========================
    // ENTREGA
    // =========================

    private String street;

    private String number;

    private String neighborhood;

    private String complement;

    // =========================
    // PAGAMENTO
    // =========================

    private PaymentMethod paymentMethod;

    // =========================
    // CUPOM
    // =========================

    private String couponCode;

    // =========================
    // ITENS
    // =========================

    private List<OrderItemRequest> items;

    // =========================
    // GETTERS / SETTERS
    // =========================

    public String getStoreSlug() {
        return storeSlug;
    }

    public void setStoreSlug(
            String storeSlug
    ) {
        this.storeSlug =
                storeSlug;
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

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(
            PaymentMethod paymentMethod
    ) {
        this.paymentMethod =
                paymentMethod;
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

    public List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(
            List<OrderItemRequest> items
    ) {
        this.items =
                items;
    }
}