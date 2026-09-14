package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.LoyaltyAccount;
import com.pizzasystem.backend.entity.LoyaltyEarningType;
import com.pizzasystem.backend.entity.LoyaltyTransaction;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.LoyaltyAccountRepository;
import com.pizzasystem.backend.repository.LoyaltyTransactionRepository;
import com.pizzasystem.backend.repository.OrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class LoyaltyService {

    private final LoyaltyAccountRepository
            loyaltyAccountRepository;

    private final LoyaltyTransactionRepository
            loyaltyTransactionRepository;

    private final OrderRepository
            orderRepository;

    public LoyaltyService(
            LoyaltyAccountRepository loyaltyAccountRepository,
            LoyaltyTransactionRepository loyaltyTransactionRepository,
            OrderRepository orderRepository
    ) {

        this.loyaltyAccountRepository =
                loyaltyAccountRepository;

        this.loyaltyTransactionRepository =
                loyaltyTransactionRepository;

        this.orderRepository =
                orderRepository;
    }

    // =========================
    // REGISTRAR FIDELIDADE
    // =========================

    @Transactional
    public void registerForOrder(
            Order order
    ) {

        if (order == null
                || order.getId() == null) {

            return;
        }

        // =========================
        // SOMENTE PEDIDO APROVADO
        // =========================

        if (order.getPaymentStatus()
                != PaymentStatus.APPROVED) {

            return;
        }

        // =========================
        // JÁ PROCESSADO
        // =========================

        if (order.isLoyaltyRegistered()) {

            return;
        }

        if (loyaltyTransactionRepository
                .existsByOrderId(
                        order.getId()
                )) {

            order.setLoyaltyRegistered(
                    true
            );

            orderRepository.save(
                    order
            );

            return;
        }

        // =========================
        // CLIENTE
        // =========================

        Customer customer =
                order.getCustomer();

        /*
         * Compra como visitante
         * não participa da fidelidade.
         */
        if (customer == null
                || customer.getId() == null) {

            return;
        }

        // =========================
        // LOJA
        // =========================

        Store store =
                order.getStore();

        if (store == null
                || store.getId() == null) {

            return;
        }

        // =========================
        // FIDELIDADE ATIVA?
        // =========================

        if (!store.isLoyaltyEnabled()) {

            return;
        }

        // =========================
        // VALOR MÍNIMO
        // =========================

        BigDecimal orderTotal =
                order.getTotal();

        if (orderTotal == null) {

            return;
        }

        BigDecimal minimumOrderValue =
                store.getLoyaltyMinimumOrderValue();

        if (minimumOrderValue != null
                && orderTotal.compareTo(
                        minimumOrderValue
                ) < 0) {

            return;
        }

        // =========================
        // CALCULAR PONTOS
        // =========================

        int earnedPoints =
                calculatePoints(
                        store,
                        orderTotal
                );

        if (earnedPoints <= 0) {

            return;
        }

        // =========================
        // BUSCAR / CRIAR CONTA
        // =========================

        LoyaltyAccount account =
                loyaltyAccountRepository
                        .findByCustomerIdAndStoreId(
                                customer.getId(),
                                store.getId()
                        )
                        .orElseGet(
                                () ->
                                        createAccount(
                                                customer,
                                                store
                                        )
                        );

        int currentPoints =
                account.getPoints() != null
                        ? account.getPoints()
                        : 0;

        int currentLifetimePoints =
                account.getLifetimePoints() != null
                        ? account.getLifetimePoints()
                        : 0;

        account.setPoints(
                currentPoints
                        + earnedPoints
        );

        account.setLifetimePoints(
                currentLifetimePoints
                        + earnedPoints
        );

        account =
                loyaltyAccountRepository
                        .save(
                                account
                        );

        // =========================
        // TRANSAÇÃO
        // =========================

        LoyaltyTransaction transaction =
                new LoyaltyTransaction();

        transaction.setLoyaltyAccount(
                account
        );

        transaction.setOrder(
                order
        );

        transaction.setPoints(
                earnedPoints
        );

        transaction.setType(
                "ORDER_REWARD"
        );

        transaction.setDescription(
                buildDescription(
                        store,
                        earnedPoints
                )
        );

        loyaltyTransactionRepository.save(
                transaction
        );

        // =========================
        // MARCAR PEDIDO
        // =========================

        order.setLoyaltyRegistered(
                true
        );

        orderRepository.save(
                order
        );

        System.out.println(
                "Fidelidade registrada para pedido #"
                        + order.getId()
                        + " | cliente: "
                        + customer.getId()
                        + " | loja: "
                        + store.getId()
                        + " | pontos: "
                        + earnedPoints
        );
    }

    // =========================
    // CALCULAR PONTOS
    // =========================

    private int calculatePoints(
            Store store,
            BigDecimal orderTotal
    ) {

        LoyaltyEarningType earningType =
                store.getLoyaltyEarningType();

        if (earningType == null) {

            earningType =
                    LoyaltyEarningType.PER_ORDER;
        }

        if (earningType
                == LoyaltyEarningType.PER_ORDER) {

            Integer pointsPerOrder =
                    store.getLoyaltyPointsPerOrder();

            if (pointsPerOrder == null
                    || pointsPerOrder <= 0) {

                return 0;
            }

            return pointsPerOrder;
        }

        // =========================
        // PER_AMOUNT
        // =========================

        BigDecimal amountStep =
                store.getLoyaltyAmountStep();

        Integer pointsPerStep =
                store.getLoyaltyPointsPerAmountStep();

        if (amountStep == null
                || amountStep.compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            return 0;
        }

        if (pointsPerStep == null
                || pointsPerStep <= 0) {

            return 0;
        }

        BigDecimal steps =
                orderTotal.divide(
                        amountStep,
                        0,
                        RoundingMode.DOWN
                );

        int completedSteps =
                steps.intValue();

        if (completedSteps <= 0) {

            return 0;
        }

        return completedSteps
                * pointsPerStep;
    }

    // =========================
    // CRIAR CONTA
    // =========================

    private LoyaltyAccount createAccount(
            Customer customer,
            Store store
    ) {

        LoyaltyAccount account =
                new LoyaltyAccount();

        account.setCustomer(
                customer
        );

        account.setStore(
                store
        );

        account.setPoints(
                0
        );

        account.setLifetimePoints(
                0
        );

        account.setRewardsRedeemed(
                0
        );

        return loyaltyAccountRepository
                .save(
                        account
                );
    }

    // =========================
    // DESCRIÇÃO
    // =========================

    private String buildDescription(
            Store store,
            int earnedPoints
    ) {

        String unit =
                earnedPoints == 1
                        ? "ponto"
                        : "pontos";

        return earnedPoints
                + " "
                + unit
                + " por pedido aprovado em "
                + store.getName();
    }
}