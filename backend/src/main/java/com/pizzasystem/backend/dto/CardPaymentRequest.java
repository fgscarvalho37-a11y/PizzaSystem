package com.pizzasystem.backend.dto;

public class CardPaymentRequest {

    private String token;
    private String paymentMethodId;
    private Integer installments;
    private String email;
    private String identificationType;
    private String identificationNumber;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPaymentMethodId() {
        return paymentMethodId;
    }

    public void setPaymentMethodId(
            String paymentMethodId
    ) {
        this.paymentMethodId = paymentMethodId;
    }

    public Integer getInstallments() {
        return installments;
    }

    public void setInstallments(
            Integer installments
    ) {
        this.installments = installments;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(
            String email
    ) {
        this.email = email;
    }

    public String getIdentificationType() {
        return identificationType;
    }

    public void setIdentificationType(
            String identificationType
    ) {
        this.identificationType =
                identificationType;
    }

    public String getIdentificationNumber() {
        return identificationNumber;
    }

    public void setIdentificationNumber(
            String identificationNumber
    ) {
        this.identificationNumber =
                identificationNumber;
    }
}