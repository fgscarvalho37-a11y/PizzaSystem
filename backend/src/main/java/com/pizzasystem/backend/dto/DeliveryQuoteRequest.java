package com.pizzasystem.backend.dto;

import java.math.BigDecimal;

public record DeliveryQuoteRequest(
        String street,
        String number,
        String city,
        String neighborhood,
        String complement,
        BigDecimal orderSubtotal
) {
}
