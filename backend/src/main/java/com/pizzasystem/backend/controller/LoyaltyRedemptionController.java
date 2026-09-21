package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.LoyaltyRedemption;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.LoyaltyRedemptionRepository;

import com.pizzasystem.backend.service.CurrentStoreService;
import com.pizzasystem.backend.service.LoyaltyService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/loyalty-redemptions")
public class LoyaltyRedemptionController {

    private final LoyaltyRedemptionRepository
            loyaltyRedemptionRepository;

    private final CurrentStoreService
            currentStoreService;

    private final LoyaltyService
            loyaltyService;

    public LoyaltyRedemptionController(
            LoyaltyRedemptionRepository loyaltyRedemptionRepository,
            CurrentStoreService currentStoreService,
            LoyaltyService loyaltyService
    ) {

        this.loyaltyRedemptionRepository =
                loyaltyRedemptionRepository;

        this.currentStoreService =
                currentStoreService;

        this.loyaltyService =
                loyaltyService;
    }

    // =========================
    // LISTAR RESGATES
    // =========================

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> list(
            @RequestParam(
                    required = false
            )
            String status
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        List<LoyaltyRedemption> redemptions;

        if (status != null
                && !status.isBlank()) {

            String normalizedStatus =
                    normalizeStatus(
                            status
                    );

            redemptions =
                    loyaltyRedemptionRepository
                            .findByStoreIdAndStatusOrderByCreatedAtDesc(
                                    store.getId(),
                                    normalizedStatus
                            );

        } else {

            redemptions =
                    loyaltyRedemptionRepository
                            .findByStoreIdOrderByCreatedAtDesc(
                                    store.getId()
                            );
        }

        List<Map<String, Object>> response =
                new ArrayList<>();

        for (LoyaltyRedemption redemption
                : redemptions) {

            response.add(
                    toResponse(
                            redemption
                    )
            );
        }

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // CONTADORES
    // =========================

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<?> summary() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        long pending =
                loyaltyRedemptionRepository
                        .countByStoreIdAndStatus(
                                store.getId(),
                                "PENDING"
                        );

        long used =
                loyaltyRedemptionRepository
                        .countByStoreIdAndStatus(
                                store.getId(),
                                "USED"
                        );

        long cancelled =
                loyaltyRedemptionRepository
                        .countByStoreIdAndStatus(
                                store.getId(),
                                "CANCELLED"
                        );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "pending",
                pending
        );

        response.put(
                "used",
                used
        );

        response.put(
                "cancelled",
                cancelled
        );

        response.put(
                "total",
                pending
                        + used
                        + cancelled
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // MARCAR COMO UTILIZADA
    // =========================

    @PatchMapping("/{id}/use")
    @Transactional
    public ResponseEntity<?> markAsUsed(
            @PathVariable Long id
    ) {

        if (id == null) {

            return error(
                    HttpStatus.BAD_REQUEST,
                    "Resgate não informado."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        LoyaltyRedemption redemption =
                loyaltyRedemptionRepository
                        .findById(id)
                        .orElse(null);

        if (redemption == null) {

            return error(
                    HttpStatus.NOT_FOUND,
                    "Resgate não encontrado."
            );
        }

        // =========================
        // SEGURANÇA MULTI-LOJA
        // =========================

        /*
         * Mesmo que alguém descubra o ID
         * de um resgate de outra loja,
         * não poderá alterá-lo.
         */
        if (redemption.getStore() == null
                || redemption.getStore().getId() == null
                || !store.getId().equals(
                        redemption
                                .getStore()
                                .getId()
                )) {

            /*
             * Retornamos 404 em vez de revelar
             * que existe um resgate pertencente
             * a outra loja.
             */
            return error(
                    HttpStatus.NOT_FOUND,
                    "Resgate não encontrado."
            );
        }

        // =========================
        // VALIDAR STATUS
        // =========================

        String currentStatus =
                redemption.getStatus();

        if ("USED".equalsIgnoreCase(
                currentStatus
        )) {

            return error(
                    HttpStatus.CONFLICT,
                    "Esta recompensa já foi utilizada."
            );
        }

        if ("CANCELLED".equalsIgnoreCase(
                currentStatus
        )) {

            return error(
                    HttpStatus.CONFLICT,
                    "Uma recompensa cancelada não pode ser utilizada."
            );
        }

        if (!"PENDING".equalsIgnoreCase(
                currentStatus
        )) {

            return error(
                    HttpStatus.CONFLICT,
                    "Esta recompensa não está pendente."
            );
        }

        // =========================
        // MARCAR COMO UTILIZADA
        // =========================

        redemption.setStatus(
                "USED"
        );

        redemption.setUsedAt(
                LocalDateTime.now()
        );

        redemption =
                loyaltyRedemptionRepository
                        .save(
                                redemption
                        );

        // =========================
        // RESPOSTA
        // =========================

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Recompensa marcada como utilizada."
        );

        response.put(
                "redemption",
                toResponse(
                        redemption
                )
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // CANCELAR RESGATE
    // =========================

    @PatchMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<?> cancel(
            @PathVariable Long id
    ) {

        if (id == null) {

            return error(
                    HttpStatus.BAD_REQUEST,
                    "Resgate não informado."
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        LoyaltyRedemption redemption =
                loyaltyRedemptionRepository
                        .findById(id)
                        .orElse(null);

        if (redemption == null) {

            return error(
                    HttpStatus.NOT_FOUND,
                    "Resgate não encontrado."
            );
        }

        // =========================
        // SEGURANÇA MULTI-LOJA
        // =========================

        if (redemption.getStore() == null
                || redemption.getStore().getId() == null
                || !store.getId().equals(
                        redemption
                                .getStore()
                                .getId()
                )) {

            return error(
                    HttpStatus.NOT_FOUND,
                    "Resgate não encontrado."
            );
        }

        // =========================
        // CANCELAR
        // =========================

        try {

            redemption =
                    loyaltyService
                            .cancelRedemption(
                                    redemption
                            );

        } catch (IllegalArgumentException e) {

            return error(
                    HttpStatus.BAD_REQUEST,
                    e.getMessage()
            );

        } catch (IllegalStateException e) {

            return error(
                    HttpStatus.CONFLICT,
                    e.getMessage()
            );
        }

        // =========================
        // RESPOSTA
        // =========================

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Recompensa cancelada e pontos devolvidos ao cliente."
        );

        response.put(
                "redemption",
                toResponse(
                        redemption
                )
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // RESPOSTA
    // =========================

    private Map<String, Object> toResponse(
            LoyaltyRedemption redemption
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        Customer customer =
                redemption.getCustomer();

        Store store =
                redemption.getStore();

        response.put(
                "id",
                redemption.getId()
        );

        response.put(
                "customerId",
                customer != null
                        ? customer.getId()
                        : null
        );

        response.put(
                "customerName",
                customer != null
                        ? customer.getName()
                        : null
        );

        response.put(
                "customerEmail",
                customer != null
                        ? customer.getEmail()
                        : null
        );

        response.put(
                "customerPhone",
                customer != null
                        ? customer.getPhone()
                        : null
        );

        response.put(
                "storeId",
                store != null
                        ? store.getId()
                        : null
        );

        response.put(
                "storeName",
                store != null
                        ? store.getName()
                        : null
        );

        response.put(
                "loyaltyAccountId",
                redemption.getLoyaltyAccount() != null
                        ? redemption
                                .getLoyaltyAccount()
                                .getId()
                        : null
        );

        response.put(
                "pointsUsed",
                redemption.getPointsUsed()
        );

        response.put(
                "rewardDescription",
                redemption.getRewardDescription()
        );

        response.put(
                "status",
                redemption.getStatus()
        );

        response.put(
                "createdAt",
                redemption.getCreatedAt()
        );

        response.put(
                "usedAt",
                redemption.getUsedAt()
        );

        response.put(
                "cancelledAt",
                redemption.getCancelledAt()
        );

        return response;
    }

    // =========================
    // NORMALIZAR STATUS
    // =========================

    private String normalizeStatus(
            String status
    ) {

        String normalized =
                status
                        .trim()
                        .toUpperCase();

        if (!normalized.equals("PENDING")
                && !normalized.equals("USED")
                && !normalized.equals("CANCELLED")) {

            throw new IllegalArgumentException(
                    "Status de resgate inválido."
            );
        }

        return normalized;
    }

    // =========================
    // ERRO
    // =========================

    private ResponseEntity<Map<String, Object>>
    error(
            HttpStatus status,
            String message
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "success",
                false
        );

        response.put(
                "message",
                message
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}