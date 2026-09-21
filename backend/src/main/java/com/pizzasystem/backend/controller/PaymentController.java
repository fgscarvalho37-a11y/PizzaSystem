package com.pizzasystem.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.pizzasystem.backend.dto.CardPaymentRequest;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentMethod;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.OrderRepository;

import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.LoyaltyService;
import com.pizzasystem.backend.service.MercadoPagoService;
import com.pizzasystem.backend.service.MercadoPagoService.MercadoPagoResult;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final OrderRepository
            orderRepository;

    private final MercadoPagoService
            mercadoPagoService;

    private final CouponService
            couponService;

    private final LoyaltyService
            loyaltyService;

    private final CurrentStoreService
            currentStoreService;

    private final ObjectMapper
            objectMapper;

    public PaymentController(
            OrderRepository orderRepository,
            MercadoPagoService mercadoPagoService,
            CouponService couponService,
            LoyaltyService loyaltyService,
            CurrentStoreService currentStoreService
    ) {

        this.orderRepository =
                orderRepository;

        this.mercadoPagoService =
                mercadoPagoService;

        this.couponService =
                couponService;

        this.loyaltyService =
                loyaltyService;

        this.currentStoreService =
                currentStoreService;

        this.objectMapper =
                new ObjectMapper();
    }

    // =========================
    // PIX - CRIAR
    // =========================

    @PostMapping(
            value = "/{orderId}/pix",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> createPix(
            @PathVariable Long orderId,
            @RequestParam(required = false) String token
    ) throws Exception {

        Order order =
                getOrderForAccess(
                        orderId,
                        token
                );

        if (order.getPaymentMethod()
                != PaymentMethod.PIX) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Este pedido não foi criado com Pix."
            );
        }

        // =========================
        // PEDIDO JÁ PAGO
        // =========================

        if (order.getPaymentStatus()
                == PaymentStatus.APPROVED) {

            return errorResponse(
                    HttpStatus.CONFLICT,
                    "Este pedido já foi pago."
            );
        }

        // =========================
        // PIX JÁ GERADO
        // =========================

        if (order.getPaymentExternalId() != null
                && !order.getPaymentExternalId()
                .isBlank()) {

            String existingOrder =
                    mercadoPagoService
                            .getOrder(
                                    order.getPaymentExternalId()
                            );

            return jsonResponse(
                    existingOrder
            );
        }

        // =========================
        // CRIAR PIX
        // =========================

        MercadoPagoResult result =
                mercadoPagoService
                        .createPixOrder(
                                order.getId(),
                                order.getTotal()
                        );

        if (result.getStatusCode() >= 400) {

            return errorResponse(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível gerar o Pix. Tente novamente."
            );
        }

        JsonNode json =
                objectMapper.readTree(
                        result.getBody()
                );

        String externalId =
                json.path("id")
                        .asText();

        if (externalId == null
                || externalId.isBlank()) {

            return errorResponse(
                    HttpStatus.BAD_GATEWAY,
                    "Mercado Pago não retornou o ID do pagamento."
            );
        }

        order.setPaymentExternalId(
                externalId
        );

        orderRepository.save(
                order
        );

        return jsonResponse(
                result.getBody()
        );
    }

    // =========================
    // PIX - CONSULTAR
    // =========================

    @GetMapping(
            value = "/{orderId}/pix",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> getPix(
            @PathVariable Long orderId,
            @RequestParam(required = false) String token
    ) {

        Order order =
                getOrderForAccess(
                        orderId,
                        token
                );

        if (order.getPaymentExternalId() == null
                || order.getPaymentExternalId()
                .isBlank()) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Este pedido ainda não possui Pix gerado."
            );
        }

        return jsonResponse(
                mercadoPagoService
                        .getOrder(
                                order.getPaymentExternalId()
                        )
        );
    }

    // =========================
    // CARTÃO
    // =========================

    @PostMapping(
            value = "/{orderId}/card",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> createCardPayment(
            @PathVariable Long orderId,
            @RequestParam(required = false) String token,
            @RequestBody CardPaymentRequest request
    ) throws Exception {

        Order order =
                getOrderForAccess(
                        orderId,
                        token
                );

        boolean debit =
                order.getPaymentMethod()
                        == PaymentMethod.DEBIT_CARD;

        boolean credit =
                order.getPaymentMethod()
                        == PaymentMethod.CREDIT_CARD;

        if (!credit && !debit) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Este pedido não foi criado com cartão."
            );
        }

        // =========================
        // CONTROLE DE NOVA TENTATIVA
        // =========================

        boolean hasExternalPayment =
                order.getPaymentExternalId() != null
                        && !order.getPaymentExternalId()
                        .isBlank();

        boolean rejected =
                order.getPaymentStatus()
                        == PaymentStatus.REJECTED;

        boolean approved =
                order.getPaymentStatus()
                        == PaymentStatus.APPROVED;

        /*
         * Se já foi aprovado, não permite
         * pagar novamente.
         */
        if (approved) {

            return errorResponse(
                    HttpStatus.CONFLICT,
                    "Este pedido já foi pago."
            );
        }

        /*
         * Se existe uma transação e ela NÃO foi
         * recusada, bloqueamos para evitar
         * pagamento duplicado.
         *
         * Se foi REJECTED, permitimos nova
         * tentativa.
         */
        if (hasExternalPayment && !rejected) {

            return errorResponse(
                    HttpStatus.CONFLICT,
                    "Este pedido já possui uma transação de pagamento em andamento."
            );
        }

        ResponseEntity<?> validationError =
                validateCardRequest(
                        request
                );

        if (validationError != null) {
            return validationError;
        }

        Integer installments =
                request.getInstallments();

        if (installments == null
                || installments <= 0) {

            installments = 1;
        }

        String paymentMethodId =
                request.getPaymentMethodId();

        if (debit
                && "elo".equalsIgnoreCase(
                        paymentMethodId
                )) {

            paymentMethodId =
                    "debelo";
        }

        // =========================
        // CRIAR PAGAMENTO
        // =========================

        MercadoPagoResult result =
                mercadoPagoService
                        .createCardOrder(
                                order.getId(),
                                order.getTotal(),
                                request.getToken(),
                                paymentMethodId,
                                debit,
                                installments,
                                request.getEmail(),
                                request.getIdentificationType(),
                                request.getIdentificationNumber()
                        );

        JsonNode json =
                objectMapper.readTree(
                        result.getBody()
                );

        // =========================
        // PAGAMENTO RECUSADO
        // =========================

        if (result.getStatusCode() == 402) {

            JsonNode data =
                    json.path("data");

            String externalId =
                    data.path("id")
                            .asText();

            String statusDetail =
                    data.path("transactions")
                            .path("payments")
                            .path(0)
                            .path("status_detail")
                            .asText();

            if (externalId != null
                    && !externalId.isBlank()) {

                order.setPaymentExternalId(
                        externalId
                );
            }

            order.setPaymentStatus(
                    PaymentStatus.REJECTED
            );

            order.setStatus(
                    OrderStatus.PENDING_PAYMENT
            );

            orderRepository.save(
                    order
            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    false
            );

            response.put(
                    "status",
                    "REJECTED"
            );

            response.put(
                    "reason",
                    statusDetail
            );

            response.put(
                    "message",
                    translateCardRejection(
                            statusDetail
                    )
            );

            return ResponseEntity
                    .status(
                            HttpStatus.PAYMENT_REQUIRED
                    )
                    .contentType(
                            MediaType.APPLICATION_JSON
                    )
                    .body(
                            response
                    );
        }

        // =========================
        // OUTROS ERROS MERCADO PAGO
        // =========================

        if (result.getStatusCode() >= 400) {

            return errorResponse(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível processar o pagamento. Tente novamente."
            );
        }

        // =========================
        // PAGAMENTO PROCESSADO
        // =========================

        String externalId =
                json.path("id")
                        .asText();

        if (externalId != null
                && !externalId.isBlank()) {

            order.setPaymentExternalId(
                    externalId
            );
        }

        updateOrderPaymentStatus(
                order,
                json
        );

        order =
                orderRepository.save(
                        order
                );

        // =========================
        // REGISTRAR USO DO CUPOM
        // =========================

        if (order.getPaymentStatus()
                == PaymentStatus.APPROVED) {

            couponService
                    .registerUsageForOrder(
                            order
                    );

            loyaltyService
                    .registerForOrder(
                            order
                    );
        }

        return jsonResponse(
                result.getBody()
        );
    }

    // =========================
    // CONSULTAR PAGAMENTO
    // =========================

    @GetMapping(
            value = "/{orderId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> getPayment(
            @PathVariable Long orderId,
            @RequestParam(required = false) String token
    ) {

        Order order =
                getOrderForAccess(
                        orderId,
                        token
                );

        if (order.getPaymentExternalId() == null
                || order.getPaymentExternalId()
                .isBlank()) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Pedido ainda não possui pagamento."
            );
        }

        return jsonResponse(
                mercadoPagoService
                        .getOrder(
                                order.getPaymentExternalId()
                        )
        );
    }

// =========================
// DEV - SINCRONIZAR PAGAMENTO
// =========================

@PostMapping(
        value = "/dev/sync/{orderId}",
        produces = MediaType.APPLICATION_JSON_VALUE
)
public ResponseEntity<?> syncPaymentDev(
        @PathVariable Long orderId
) throws Exception {

    /*
     * Endpoint temporário para desenvolvimento.
     *
     * Só funciona com administrador autenticado
     * e respeita a Store do administrador.
     */

    if (!isAdminAuthenticated()) {

        return errorResponse(
                HttpStatus.UNAUTHORIZED,
                "Administrador não autenticado."
        );
    }

    Order order =
            getOrderForAccess(
                    orderId,
                    null
            );

    if (order.getPaymentExternalId() == null
            || order.getPaymentExternalId()
            .isBlank()) {

        return errorResponse(
                HttpStatus.BAD_REQUEST,
                "Pedido ainda não possui pagamento no Mercado Pago."
        );
    }

    String mercadoPagoResponse =
            mercadoPagoService.getOrder(
                    order.getPaymentExternalId()
            );

    JsonNode json =
            objectMapper.readTree(
                    mercadoPagoResponse
            );

    PaymentStatus previousPaymentStatus =
            order.getPaymentStatus();

    updateOrderPaymentStatus(
            order,
            json
    );

    order =
            orderRepository.save(
                    order
            );

    /*
     * Se acabou de ser aprovado,
     * registra o uso do cupom.
     */
    if (previousPaymentStatus != PaymentStatus.APPROVED
            && order.getPaymentStatus()
            == PaymentStatus.APPROVED) {

        couponService.registerUsageForOrder(
                order
        );

        loyaltyService.registerForOrder(
                order
        );
    }

    Map<String, Object> response =
            new HashMap<>();

    response.put(
            "success",
            true
    );

    response.put(
            "orderId",
            order.getId()
    );

    response.put(
            "storeId",
            order.getStore() != null
                    ? order.getStore().getId()
                    : null
    );

    response.put(
            "paymentExternalId",
            order.getPaymentExternalId()
    );

    response.put(
            "paymentStatus",
            order.getPaymentStatus()
                    .name()
    );

    response.put(
            "orderStatus",
            order.getStatus()
                    .name()
    );

    return ResponseEntity
            .ok()
            .contentType(
                    MediaType.APPLICATION_JSON
            )
            .body(
                    response
            );
}
    // =========================
    // DEV - APROVAR PAGAMENTO
    // =========================

    @PostMapping(
            value = "/dev/approve/{orderId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> approvePaymentDev(
            @PathVariable Long orderId
    ) {

        /*
         * Endpoint temporário para desenvolvimento.
         * Aprova o pedido localmente sem pagamento real.
         * Só funciona com administrador autenticado
         * e respeita a Store do administrador.
         */

        if (!isAdminAuthenticated()) {
            return errorResponse(
                    HttpStatus.UNAUTHORIZED,
                    "Administrador não autenticado."
            );
        }

        Order order =
                getOrderForAccess(
                        orderId,
                        null
                );

        PaymentStatus previousPaymentStatus =
                order.getPaymentStatus();

        order.setPaymentStatus(
                PaymentStatus.APPROVED
        );

        order.setStatus(
                OrderStatus.RECEIVED
        );

        order =
                orderRepository.save(
                        order
                );

        if (previousPaymentStatus != PaymentStatus.APPROVED) {

            couponService.registerUsageForOrder(
                    order
            );

            loyaltyService.registerForOrder(
                    order
            );
        }

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put("orderId", order.getId());
        response.put(
                "storeId",
                order.getStore() != null
                        ? order.getStore().getId()
                        : null
        );
        response.put(
                "paymentStatus",
                order.getPaymentStatus().name()
        );
        response.put(
                "orderStatus",
                order.getStatus().name()
        );
        response.put(
                "loyaltyRegistered",
                order.isLoyaltyRegistered()
        );

        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    // =========================
    // DEV - REPROCESSAR FIDELIDADE
    // =========================

    @PostMapping(
            value = "/dev/loyalty/{orderId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> reprocessLoyaltyDev(
            @PathVariable Long orderId
    ) {

        if (!isAdminAuthenticated()) {
            return errorResponse(
                    HttpStatus.UNAUTHORIZED,
                    "Administrador não autenticado."
            );
        }

        Order order =
                getOrderForAccess(
                        orderId,
                        null
                );

        loyaltyService.registerForOrder(
                order
        );

        order =
                orderRepository.findById(
                        orderId
                ).orElse(order);

        Map<String, Object> response =
                new HashMap<>();

        response.put("success", true);
        response.put("orderId", order.getId());
        response.put(
                "storeId",
                order.getStore() != null
                        ? order.getStore().getId()
                        : null
        );
        response.put(
                "paymentStatus",
                order.getPaymentStatus().name()
        );
        response.put(
                "loyaltyRegistered",
                order.isLoyaltyRegistered()
        );

        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    // =========================
    // AUXILIARES
    // =========================

    private Order getOrderForAccess(
            Long orderId,
            String token
    ) {

        /*
         * ADMIN
         *
         * Um administrador autenticado só
         * pode acessar pagamentos de pedidos
         * pertencentes à própria Store.
         */
        if (isAdminAuthenticated()) {

            Store currentStore =
                    currentStoreService
                            .getCurrentStore();

            return orderRepository
                    .findById(
                            orderId
                    )
                    .filter(order ->
                            belongsToStore(
                                    order,
                                    currentStore
                            )
                    )
                    .orElseThrow(
                            this::orderNotFound
                    );
        }

        /*
         * CLIENTE
         *
         * Conhecer apenas o ID sequencial
         * do pedido não autoriza acesso.
         */
        if (token == null
                || token.isBlank()) {

            throw orderNotFound();
        }

        return orderRepository
                .findByIdAndPublicAccessToken(
                        orderId,
                        token.trim()
                )
                .orElseThrow(
                        this::orderNotFound
                );
    }

    // =========================
    // PEDIDO PERTENCE À STORE?
    // =========================

    private boolean belongsToStore(
            Order order,
            Store store
    ) {

        if (order == null
                || store == null
                || store.getId() == null) {

            return false;
        }

        if (order.getStore() == null
                || order.getStore()
                .getId() == null) {

            return false;
        }

        return order.getStore()
                .getId()
                .equals(
                        store.getId()
                );
    }

    // =========================
    // ADMIN AUTENTICADO?
    // =========================

    private boolean isAdminAuthenticated() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            return false;
        }

        return authentication
                .getAuthorities()
                .stream()
                .anyMatch(
                        authority ->
                                "ROLE_ADMIN".equals(
                                        authority.getAuthority()
                                )
                );
    }

    // =========================
    // PEDIDO NÃO ENCONTRADO
    // =========================

    private ResponseStatusException orderNotFound() {

        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Pedido não encontrado"
        );
    }

    // =========================
    // VALIDAR CARTÃO
    // =========================

    private ResponseEntity<?> validateCardRequest(
            CardPaymentRequest request
    ) {

        if (request == null) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Dados do cartão não informados."
            );
        }

        if (request.getToken() == null
                || request.getToken()
                .isBlank()) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Token do cartão não informado."
            );
        }

        if (request.getPaymentMethodId() == null
                || request.getPaymentMethodId()
                .isBlank()) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "Meio de pagamento não informado."
            );
        }

        if (request.getEmail() == null
                || request.getEmail()
                .isBlank()) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    "E-mail do pagador não informado."
            );
        }

        return null;
    }

    // =========================
    // ATUALIZAR STATUS
    // =========================

    private void updateOrderPaymentStatus(
            Order order,
            JsonNode json
    ) {

        String orderStatus =
                json.path("status")
                        .asText();

        JsonNode payments =
                json.path("transactions")
                        .path("payments");

        String paymentStatus = "";
        String statusDetail = "";

        if (payments.isArray()
                && !payments.isEmpty()) {

            JsonNode payment =
                    payments.get(0);

            paymentStatus =
                    payment.path("status")
                            .asText();

            statusDetail =
                    payment.path("status_detail")
                            .asText();
        }

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
                                statusDetail
                        )
                );

        if (approved) {

            order.setPaymentStatus(
                    PaymentStatus.APPROVED
            );

            order.setStatus(
                    OrderStatus.RECEIVED
            );

            return;
        }

        if ("failed".equalsIgnoreCase(
                paymentStatus
        )
                || "rejected".equalsIgnoreCase(
                paymentStatus
        )) {

            order.setPaymentStatus(
                    PaymentStatus.REJECTED
            );

            order.setStatus(
                    OrderStatus.PENDING_PAYMENT
            );

            return;
        }

        order.setPaymentStatus(
                PaymentStatus.PENDING
        );

        order.setStatus(
                OrderStatus.PENDING_PAYMENT
        );
    }

    // =========================
    // TRADUZIR RECUSA
    // =========================

    private String translateCardRejection(
            String statusDetail
    ) {

        if (statusDetail == null
                || statusDetail.isBlank()) {

            return "Pagamento recusado. Tente novamente ou utilize outro cartão.";
        }

        return switch (
                statusDetail.toLowerCase()
        ) {

            case "rejected_by_issuer" ->
                    "Pagamento recusado pelo banco emissor. Tente outro cartão ou entre em contato com seu banco.";

            case "insufficient_amount",
                 "cc_rejected_insufficient_amount" ->
                    "Pagamento recusado por saldo ou limite insuficiente.";

            case "invalid_card",
                 "cc_rejected_bad_filled_card_number" ->
                    "Confira o número do cartão e tente novamente.";

            case "invalid_expiration_date",
                 "cc_rejected_bad_filled_date" ->
                    "Confira a validade do cartão e tente novamente.";

            case "invalid_security_code",
                 "cc_rejected_bad_filled_security_code" ->
                    "Confira o código de segurança do cartão.";

            case "high_risk",
                 "cc_rejected_high_risk" ->
                    "O pagamento foi recusado por segurança. Tente outro cartão.";

            default ->
                    "Pagamento recusado. Tente novamente ou utilize outro cartão.";
        };
    }

    // =========================
    // RESPOSTA JSON
    // =========================

    private ResponseEntity<String> jsonResponse(
            String body
    ) {

        return ResponseEntity
                .ok()
                .contentType(
                        MediaType.APPLICATION_JSON
                )
                .body(
                        body
                );
    }

    // =========================
    // RESPOSTA DE ERRO
    // =========================

    private ResponseEntity<Map<String, Object>>
    errorResponse(
            HttpStatus status,
            String message
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                false
        );

        response.put(
                "message",
                message
        );

        return ResponseEntity
                .status(
                        status
                )
                .contentType(
                        MediaType.APPLICATION_JSON
                )
                .body(
                        response
                );
    }
}