package com.pizzasystem.backend.service;

public record MercadoPagoResponse(
        int statusCode,
        String body
) {
}