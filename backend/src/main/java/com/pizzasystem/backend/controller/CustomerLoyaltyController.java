package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.LoyaltyAccount;
import com.pizzasystem.backend.entity.LoyaltyRedemption;
import com.pizzasystem.backend.entity.LoyaltyTransaction;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.LoyaltyAccountRepository;
import com.pizzasystem.backend.repository.LoyaltyRedemptionRepository;
import com.pizzasystem.backend.repository.LoyaltyTransactionRepository;

import com.pizzasystem.backend.service.LoyaltyService;
import com.pizzasystem.backend.service.PublicStoreService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/loyalty")
public class CustomerLoyaltyController {

    private static final String SESSION_CUSTOMER_ID =
            "CUSTOMER_ID";

    private final LoyaltyAccountRepository
            loyaltyAccountRepository;

    private final LoyaltyTransactionRepository
            loyaltyTransactionRepository;

    private final LoyaltyRedemptionRepository
            loyaltyRedemptionRepository;

    private final LoyaltyService
            loyaltyService;

    private final PublicStoreService
            publicStoreService;

    public CustomerLoyaltyController(
            LoyaltyAccountRepository loyaltyAccountRepository,
            LoyaltyTransactionRepository loyaltyTransactionRepository,
            LoyaltyRedemptionRepository loyaltyRedemptionRepository,
            LoyaltyService loyaltyService,
            PublicStoreService publicStoreService
    ) {

        this.loyaltyAccountRepository =
                loyaltyAccountRepository;

        this.loyaltyTransactionRepository =
                loyaltyTransactionRepository;

        this.loyaltyRedemptionRepository =
                loyaltyRedemptionRepository;

        this.loyaltyService =
                loyaltyService;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // FIDELIDADE DO CLIENTE
    // =========================

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyLoyalty(
            @RequestParam(required = false) String store,
            HttpServletRequest request
    ) {

        Long customerId =
                getCustomerIdFromSession(
                        request
                );

        if (customerId == null) {
            return unauthorized();
        }

        // =========================
        // CONTAS DE FIDELIDADE
        // =========================

        Store requestedStore =
                null;

        if (
                store != null &&
                !store.isBlank()
        ) {
            requestedStore =
                    publicStoreService
                            .getBySlug(
                                    store.trim()
                            );
        }

        List<LoyaltyAccount> accounts;

        if (requestedStore != null) {

            LoyaltyAccount account =
                    loyaltyAccountRepository
                            .findByCustomerIdAndStoreId(
                                    customerId,
                                    requestedStore.getId()
                            )
                            .orElse(null);

            accounts =
                    account != null
                            ? List.of(account)
                            : List.of();

        } else {

            accounts =
                    loyaltyAccountRepository
                            .findByCustomerIdOrderByUpdatedAtDesc(
                                    customerId
                            );
        }

        List<Map<String, Object>> accountResponses =
                new ArrayList<>();

        int totalPoints = 0;
        int totalLifetimePoints = 0;
        int totalRewardsRedeemed = 0;

        for (LoyaltyAccount account : accounts) {

            int points =
                    account.getPoints() != null
                            ? account.getPoints()
                            : 0;

            int lifetimePoints =
                    account.getLifetimePoints() != null
                            ? account.getLifetimePoints()
                            : 0;

            int rewardsRedeemed =
                    account.getRewardsRedeemed() != null
                            ? account.getRewardsRedeemed()
                            : 0;

            totalPoints +=
                    points;

            totalLifetimePoints +=
                    lifetimePoints;

            totalRewardsRedeemed +=
                    rewardsRedeemed;

            Store accountStore =
                    account.getStore();

            Integer stampGoal =
                    accountStore.getLoyaltyStampGoal();

            String rewardDescription =
                    accountStore.getLoyaltyRewardDescription();

            boolean loyaltyEnabled =
                    accountStore.isLoyaltyEnabled();

            boolean rewardAvailable =
                    loyaltyEnabled
                            && stampGoal != null
                            && stampGoal > 0
                            && rewardDescription != null
                            && !rewardDescription.isBlank()
                            && points >= stampGoal;

            int pointsMissing = 0;

            if (stampGoal != null
                    && stampGoal > 0
                    && points < stampGoal) {

                pointsMissing =
                        stampGoal - points;
            }

            // =========================
            // TRANSAÇÕES
            // =========================

            List<LoyaltyTransaction> transactions =
                    loyaltyTransactionRepository
                            .findByLoyaltyAccountIdOrderByCreatedAtDesc(
                                    account.getId()
                            );

            List<Map<String, Object>> transactionResponses =
                    new ArrayList<>();

            for (LoyaltyTransaction transaction : transactions) {

                Map<String, Object> transactionResponse =
                        new HashMap<>();

                transactionResponse.put(
                        "id",
                        transaction.getId()
                );

                transactionResponse.put(
                        "points",
                        transaction.getPoints()
                );

                transactionResponse.put(
                        "type",
                        transaction.getType()
                );

                transactionResponse.put(
                        "description",
                        transaction.getDescription()
                );

                transactionResponse.put(
                        "createdAt",
                        transaction.getCreatedAt()
                );

                transactionResponse.put(
                        "orderId",
                        transaction.getOrder() != null
                                ? transaction
                                        .getOrder()
                                        .getId()
                                : null
                );

                transactionResponses.add(
                        transactionResponse
                );
            }

            // =========================
            // RESPONSE DA CONTA
            // =========================

            Map<String, Object> accountResponse =
                    new HashMap<>();

            accountResponse.put(
                    "id",
                    account.getId()
            );

            accountResponse.put(
                    "storeId",
                    accountStore.getId()
            );

            accountResponse.put(
                    "storeName",
                    accountStore.getName()
            );

            accountResponse.put(
                    "points",
                    points
            );

            accountResponse.put(
                    "lifetimePoints",
                    lifetimePoints
            );

            accountResponse.put(
                    "rewardsRedeemed",
                    rewardsRedeemed
            );

            accountResponse.put(
                    "loyaltyEnabled",
                    loyaltyEnabled
            );

            accountResponse.put(
                    "stampGoal",
                    stampGoal
            );

            accountResponse.put(
                    "rewardDescription",
                    rewardDescription
            );

            accountResponse.put(
                    "rewardAvailable",
                    rewardAvailable
            );

            accountResponse.put(
                    "pointsMissing",
                    pointsMissing
            );

            accountResponse.put(
                    "createdAt",
                    account.getCreatedAt()
            );

            accountResponse.put(
                    "updatedAt",
                    account.getUpdatedAt()
            );

            accountResponse.put(
                    "transactions",
                    transactionResponses
            );

            accountResponses.add(
                    accountResponse
            );
        }

        // =========================
        // RESGATES DO CLIENTE
        // =========================

        List<LoyaltyRedemption> redemptions;

        if (requestedStore != null) {

            redemptions =
                    loyaltyRedemptionRepository
                            .findByCustomerIdAndStoreIdOrderByCreatedAtDesc(
                                    customerId,
                                    requestedStore.getId()
                            );

        } else {

            redemptions =
                    loyaltyRedemptionRepository
                            .findByCustomerIdOrderByCreatedAtDesc(
                                    customerId
                            );
        }

        List<Map<String, Object>> redemptionResponses =
                new ArrayList<>();

        for (LoyaltyRedemption redemption : redemptions) {

            Map<String, Object> redemptionResponse =
                    new HashMap<>();

            Store redemptionStore =
                    redemption.getStore();

            redemptionResponse.put(
                    "id",
                    redemption.getId()
            );

            redemptionResponse.put(
                    "storeId",
                    redemptionStore != null
                            ? redemptionStore.getId()
                            : null
            );

            redemptionResponse.put(
                    "storeName",
                    redemptionStore != null
                            ? redemptionStore.getName()
                            : null
            );

            redemptionResponse.put(
                    "loyaltyAccountId",
                    redemption.getLoyaltyAccount() != null
                            ? redemption
                                    .getLoyaltyAccount()
                                    .getId()
                            : null
            );

            redemptionResponse.put(
                    "pointsUsed",
                    redemption.getPointsUsed()
            );

            redemptionResponse.put(
                    "rewardDescription",
                    redemption.getRewardDescription()
            );

            redemptionResponse.put(
                    "status",
                    redemption.getStatus()
            );

            redemptionResponse.put(
                    "createdAt",
                    redemption.getCreatedAt()
            );

            redemptionResponse.put(
                    "usedAt",
                    redemption.getUsedAt()
            );

            redemptionResponse.put(
                    "cancelledAt",
                    redemption.getCancelledAt()
            );

            redemptionResponses.add(
                    redemptionResponse
            );
        }

        // =========================
        // RESPONSE FINAL
        // =========================

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "customerId",
                customerId
        );

        response.put(
                "totalPoints",
                totalPoints
        );

        response.put(
                "totalLifetimePoints",
                totalLifetimePoints
        );

        response.put(
                "totalRewardsRedeemed",
                totalRewardsRedeemed
        );

        response.put(
                "accounts",
                accountResponses
        );

        response.put(
                "redemptions",
                redemptionResponses
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // RESGATAR RECOMPENSA
    // =========================

    @PostMapping("/{storeId}/redeem")
    public ResponseEntity<?> redeemReward(
            @PathVariable Long storeId,
            HttpServletRequest request
    ) {

        Long customerId =
                getCustomerIdFromSession(
                        request
                );

        if (customerId == null) {
            return unauthorized();
        }

        try {

            LoyaltyTransaction transaction =
                    loyaltyService
                            .redeemReward(
                                    customerId,
                                    storeId
                            );

            LoyaltyAccount account =
                    transaction
                            .getLoyaltyAccount();

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "message",
                    "Recompensa resgatada com sucesso."
            );

            response.put(
                    "transactionId",
                    transaction.getId()
            );

            response.put(
                    "storeId",
                    storeId
            );

            response.put(
                    "pointsUsed",
                    Math.abs(
                            transaction.getPoints()
                    )
            );

            response.put(
                    "remainingPoints",
                    account.getPoints()
            );

            response.put(
                    "rewardsRedeemed",
                    account.getRewardsRedeemed()
            );

            response.put(
                    "description",
                    transaction.getDescription()
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (IllegalArgumentException e) {

            return errorResponse(
                    HttpStatus.BAD_REQUEST,
                    e.getMessage()
            );

        } catch (IllegalStateException e) {

            return errorResponse(
                    HttpStatus.CONFLICT,
                    e.getMessage()
            );
        }
    }

    // =========================
    // CLIENTE DA SESSÃO
    // =========================

    private Long getCustomerIdFromSession(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(false);

        if (session == null) {
            return null;
        }

        Object customerIdObject =
                session.getAttribute(
                        SESSION_CUSTOMER_ID
                );

        if (!(customerIdObject
                instanceof Long customerId)) {

            return null;
        }

        return customerId;
    }

    // =========================
    // ERRO
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
                .status(status)
                .body(response);
    }

    // =========================
    // NÃO AUTENTICADO
    // =========================

    private ResponseEntity<Map<String, Object>>
    unauthorized() {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                false
        );

        response.put(
                "success",
                false
        );

        response.put(
                "message",
                "Cliente não autenticado."
        );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(response);
    }
}