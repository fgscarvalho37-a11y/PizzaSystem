package com.pizzasystem.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record DeliveryQuoteRequest(

        @NotBlank(message = "Rua não informada.")
        @Size(max = 180, message = "Rua muito longa.")
        String street,

        @NotBlank(message = "Número não informado.")
        @Size(max = 30, message = "Número inválido.")
        String number,

        @NotBlank(message = "Cidade não informada.")
        @Size(max = 120, message = "Cidade muito longa.")
        String city,

        @Size(max = 120, message = "Bairro muito longo.")
        String neighborhood,

        @Size(max = 80, message = "Estado inválido.")
        String state,

        @Size(max = 30, message = "Código postal inválido.")
        String postalCode,

        @Size(max = 250, message = "Complemento muito longo.")
        String complement,

        @DecimalMin(
                value = "0.00",
                inclusive = true,
                message = "Subtotal inválido."
        )
        @Digits(
                integer = 10,
                fraction = 2,
                message = "Subtotal inválido."
        )
        BigDecimal orderSubtotal
) {
}
