package com.pizzasystem.backend.dto;

public class OrderItemRequest {

    private Long productId;
    private Integer quantity;
    private String observation;

    // =========================
    // BORDA
    // =========================

    private Long crustId;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(
            Long productId
    ) {
        this.productId =
                productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity
    ) {
        this.quantity =
                quantity;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(
            String observation
    ) {
        this.observation =
                observation;
    }

    public Long getCrustId() {
        return crustId;
    }

    public void setCrustId(
            Long crustId
    ) {
        this.crustId =
                crustId;
    }
}