package com.pizzasystem.backend.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    RECEIVED,
    PREPARING,
    READY,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}