package com.pizzasystem.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CardPaymentRequest {

    @NotBlank(message = "Token do cartão não informado.")
    @Size(max = 2048, message = "Token do cartão inválido.")
    private String token;

    @NotBlank(message = "Forma de pagamento do cartão não informada.")
    @Size(max = 80, message = "Forma de pagamento inválida.")
    private String paymentMethodId;

    @Min(value = 1, message = "Número de parcelas inválido.")
    @Max(value = 48, message = "Número de parcelas inválido.")
    private Integer installments;

    @NotBlank(message = "E-mail do pagador não informado.")
    @Email(message = "E-mail do pagador inválido.")
    @Size(max = 255, message = "E-mail do pagador inválido.")
    private String email;

    @Size(max = 30, message = "Tipo de documento inválido.")
    private String identificationType;

    @Size(max = 40, message = "Documento inválido.")
    private String identificationNumber;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(String paymentMethodId) { this.paymentMethodId = paymentMethodId; }

    public Integer getInstallments() { return installments; }
    public void setInstallments(Integer installments) { this.installments = installments; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getIdentificationType() { return identificationType; }
    public void setIdentificationType(String identificationType) { this.identificationType = identificationType; }

    public String getIdentificationNumber() { return identificationNumber; }
    public void setIdentificationNumber(String identificationNumber) { this.identificationNumber = identificationNumber; }
}
