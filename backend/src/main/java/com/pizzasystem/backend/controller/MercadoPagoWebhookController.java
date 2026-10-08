package com.pizzasystem.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.LoyaltyService;
import com.pizzasystem.backend.service.MercadoPagoService;
import com.pizzasystem.backend.service.PaymentStateGuard;
import com.pizzasystem.backend.service.MercadoPagoWebhookSignatureService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class MercadoPagoWebhookController {

    private final OrderRepository orderRepository;
    private final MercadoPagoService mercadoPagoService;
    private final MercadoPagoWebhookSignatureService signatureService;
    private final CouponService couponService;
    private final LoyaltyService loyaltyService;
    private final ObjectMapper objectMapper;

    public MercadoPagoWebhookController(
            OrderRepository orderRepository,
            MercadoPagoService mercadoPagoService,
            MercadoPagoWebhookSignatureService signatureService,
            CouponService couponService,
            LoyaltyService loyaltyService
    ) {
        this.orderRepository =
                orderRepository;

        this.mercadoPagoService =
                mercadoPagoService;

        this.signatureService =
                signatureService;

        this.couponService =
                couponService;

        this.loyaltyService =
                loyaltyService;

        this.objectMapper =
                new ObjectMapper();
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody(required = false) String body,

            @RequestParam(
                    value = "data.id",
                    required = false
            ) String queryDataId,

            @RequestHeader(
                    value = "x-signature",
                    required = false
            ) String xSignature,

            @RequestHeader(
                    value = "x-request-id",
                    required = false
            ) String xRequestId
    ) {

        try {

            String mercadoPagoOrderId =
                    queryDataId;

            // =========================
            // TENTAR PEGAR ID DO BODY
            // =========================

            if ((mercadoPagoOrderId == null
                    || mercadoPagoOrderId.isBlank())
                    && body != null
                    && !body.isBlank()) {

                JsonNode notification =
                        objectMapper.readTree(
                                body
                        );

                mercadoPagoOrderId =
                        notification
                                .path("data")
                                .path("id")
                                .asText();
            }

            // =========================
            // VALIDAR ID
            // =========================

            if (mercadoPagoOrderId == null
                    || mercadoPagoOrderId.isBlank()) {

                return ResponseEntity
                        .badRequest()
                        .build();
            }

            // =========================
            // VALIDAR ASSINATURA
            // =========================

            boolean validSignature =
                    signatureService.isValid(
                            xSignature,
                            xRequestId,
                            mercadoPagoOrderId
                    );

            if (!validSignature) {

                return ResponseEntity
                        .status(401)
                        .build();
            }

            // =========================
            // LOCALIZAR PEDIDO
            // =========================

            Order order =
                    orderRepository
                            .findByPaymentExternalId(
                                    mercadoPagoOrderId
                            )
                            .orElse(null);

            if (order == null) {

                return ResponseEntity
                        .ok()
                        .build();
            }

            // =========================
            // CONSULTAR MERCADO PAGO
            // =========================

            String mercadoPagoResponse =
                    mercadoPagoService.getOrder(
                            mercadoPagoOrderId
                    );

            JsonNode mercadoPagoOrder =
                    objectMapper.readTree(
                            mercadoPagoResponse
                    );

            String orderStatus =
                    mercadoPagoOrder
                            .path("status")
                            .asText();

            String paymentStatus =
                    "";

            String paymentStatusDetail =
                    "";

            JsonNode payments =
                    mercadoPagoOrder
                            .path("transactions")
                            .path("payments");

            if (payments.isArray()
                    && !payments.isEmpty()) {

                paymentStatus =
                        payments
                                .get(0)
                                .path("status")
                                .asText();

                paymentStatusDetail =
                        payments
                                .get(0)
                                .path("status_detail")
                                .asText();
            }

            // =========================
            // VERIFICAR APROVAÇÃO
            // =========================

            boolean approved =
                    "processed".equalsIgnoreCase(
                            paymentStatus
                    )
                            || "approved".equalsIgnoreCase(
                            paymentStatus
                    )
                            || (
                            "processed".equalsIgnoreCase(
                                    orderStatus
                            )
                                    && "accredited".equalsIgnoreCase(
                                    paymentStatusDetail
                            )
                    );

            if (approved) {

                PaymentStateGuard.markApproved(order);

                order =
                        orderRepository.save(
                                order
                        );

                // =========================
                // REGISTRAR USO DO CUPOM
                // =========================

                couponService.registerUsageForOrder(
                        order
                );

                // =========================
                // REGISTRAR FIDELIDADE
                // =========================

                loyaltyService.registerForOrder(
                        order
                );

            }

            return ResponseEntity
                    .ok()
                    .build();

        } catch (Exception e) {
            return ResponseEntity
                    .internalServerError()
                    .build();
        }
    }
}
