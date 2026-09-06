package com.pizzasystem.backend.service;

import com.mercadopago.exceptions.MPInvalidWebhookSignatureException;
import com.mercadopago.webhook.WebhookSignatureValidator;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MercadoPagoWebhookSignatureService {

    @Value("${mercadopago.webhook-secret}")
    private String webhookSecret;

    public boolean isValid(
            String xSignature,
            String xRequestId,
            String dataId
    ) {

        try {

            String normalizedDataId =
                    dataId != null
                            ? dataId.toLowerCase()
                            : null;

            WebhookSignatureValidator.validate(
                    xSignature,
                    xRequestId,
                    normalizedDataId,
                    webhookSecret
            );

            return true;

        } catch (MPInvalidWebhookSignatureException e) {

            System.out.println(
                    "Assinatura Mercado Pago inválida"
            );

            return false;

        } catch (Exception e) {

            System.out.println(
                    "Erro ao validar assinatura Mercado Pago: "
                            + e.getMessage()
            );

            e.printStackTrace();

            return false;
        }
    }
}