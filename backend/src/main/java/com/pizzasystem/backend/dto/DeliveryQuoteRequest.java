package com.pizzasystem.backend.dto;

public record DeliveryQuoteRequest(
        String street,
        String number,
        String city,
        String neighborhood,
        String complement
) {
}
