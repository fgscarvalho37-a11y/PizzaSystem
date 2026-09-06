package com.pizzasystem.backend.dto;

public record StoreStatusResponse(
        String storeName,
        boolean manualOpen,
        boolean open,
        String message,
        long ordersToday,
        Integer dailyOrderLimit
) {
}