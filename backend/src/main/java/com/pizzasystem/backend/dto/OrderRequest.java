package com.pizzasystem.backend.dto;

import com.pizzasystem.backend.entity.PaymentMethod;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
    @NotBlank(message = "Loja não informada.")
    @Size(max = 80, message = "Loja inválida.")
    @Pattern(
            regexp = "^[a-zA-Z0-9-]+$",
            message = "Loja inválida."
    )
    private String storeSlug;

    // =========================
    // CLIENTE
    // =========================

    @NotBlank(message = "Nome do cliente não informado.")
    @Size(max = 120, message = "Nome do cliente muito longo.")
    private String customerName;

    @NotBlank(message = "Telefone do cliente não informado.")
    @Size(max = 40, message = "Telefone inválido.")
    private String customerPhone;

    // =========================
    // ENTREGA
    // =========================

    @NotBlank(message = "Rua não informada.")
    @Size(max = 180, message = "Rua muito longa.")
    private String street;

    @NotBlank(message = "Número não informado.")
    @Size(max = 30, message = "Número inválido.")
    private String number;

    @NotBlank(message = "Cidade não informada.")
    @Size(max = 120, message = "Cidade muito longa.")
    private String city;

    @Size(max = 120, message = "Bairro muito longo.")
    private String neighborhood;

    @Size(max = 80, message = "Estado inválido.")
    private String state;

    @Size(max = 30, message = "Código postal inválido.")
    private String postalCode;

    @Size(max = 250, message = "Complemento muito longo.")
    private String complement;

    // =========================
    // PAGAMENTO
    // =========================

    @NotNull(message = "Forma de pagamento não informada.")
    private PaymentMethod paymentMethod;

    // =========================
    // CUPOM
    // =========================

    @Size(max = 60, message = "Cupom inválido.")
    private String couponCode;

    // =========================
    // ITENS
    // =========================

    @Valid
    @NotEmpty(message = "O pedido precisa ter pelo menos um item.")
    @Size(max = 100, message = "Quantidade de itens acima do limite permitido.")
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

    public String getState() {
        return state;
    }

    public void setState(
            String state
    ) {
        this.state =
                state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(
            String postalCode
    ) {
        this.postalCode =
                postalCode;
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