package com.pizzasystem.backend.dto;

import java.math.BigDecimal;

public record DeliveryQuoteResponse(
        String pricingMode,
        BigDecimal distanceKm,
        BigDecimal feePerKm,
        BigDecimal fee,
        String city,
        String neighborhood,
        boolean freeDelivery,
        BigDecimal freeDeliveryAbove,
        BigDecimal freeDeliveryDistanceKm,
        String routeProvider,
        String googleMapsUrl
) {
}
