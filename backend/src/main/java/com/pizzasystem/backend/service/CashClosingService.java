package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.CashClosing;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.CashClosingRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CashClosingService {

    private final CashClosingRepository cashClosingRepository;
    private final CashService cashService;
    private final CurrentStoreService currentStoreService;

    public CashClosingService(
            CashClosingRepository cashClosingRepository,
            CashService cashService,
            CurrentStoreService currentStoreService
    ) {
        this.cashClosingRepository =
                cashClosingRepository;

        this.cashService =
                cashService;

        this.currentStoreService =
                currentStoreService;
    }

    // =========================
    // FECHAR CAIXA
    // =========================

    @Transactional
    public CashClosing closeCash(
            LocalDate date
    ) {

        if (date == null) {
            throw new RuntimeException(
                    "Data do fechamento não informada"
            );
        }

        Store store =
                currentStoreService
                        .getCurrentStore();

        if (
                cashClosingRepository
                        .existsByStoreIdAndDate(
                                store.getId(),
                                date
                        )
        ) {
            throw new RuntimeException(
                    "O caixa desta data já foi fechado"
            );
        }

        Map<String, Object> summary =
                cashService.getCashSummary(
                        date
                );

        CashClosing closing =
                new CashClosing();

        closing.setStore(
                store
        );

        closing.setDate(
                date
        );

        closing.setClosedAt(
                LocalDateTime.now()
        );

        closing.setTotalRevenue(
                getBigDecimal(
                        summary,
                        "totalRevenue"
                )
        );

        closing.setProductRevenue(
                getBigDecimal(
                        summary,
                        "productRevenue"
                )
        );

        closing.setDeliveryFees(
                getBigDecimal(
                        summary,
                        "deliveryFees"
                )
        );

        closing.setOrderCount(
                getLong(
                        summary,
                        "orderCount"
                )
        );

        closing.setAverageTicket(
                getBigDecimal(
                        summary,
                        "averageTicket"
                )
        );

        closing.setDeliveredOrders(
                getLong(
                        summary,
                        "deliveredOrders"
                )
        );

        closing.setActiveOrders(
                getLong(
                        summary,
                        "activeOrders"
                )
        );

        closing.setCancelledOrders(
                getLong(
                        summary,
                        "cancelledOrders"
                )
        );

        Map<?, ?> revenueByPaymentMethod =
                getMap(
                        summary,
                        "revenueByPaymentMethod"
                );

        closing.setPixRevenue(
                getBigDecimalFromMap(
                        revenueByPaymentMethod,
                        "PIX"
                )
        );

        closing.setCreditCardRevenue(
                getBigDecimalFromMap(
                        revenueByPaymentMethod,
                        "CREDIT_CARD"
                )
        );

        closing.setDebitCardRevenue(
                getBigDecimalFromMap(
                        revenueByPaymentMethod,
                        "DEBIT_CARD"
                )
        );

        return cashClosingRepository.save(
                closing
        );
    }

    // =========================
    // BUSCAR POR DATA
    // =========================

    public CashClosing getByDate(
            LocalDate date
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return cashClosingRepository
                .findByStoreIdAndDate(
                        storeId,
                        date
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Não existe fechamento para esta data"
                        )
                );
    }

    // =========================
    // VERIFICAR SE FOI FECHADO
    // =========================

    public boolean isClosed(
            LocalDate date
    ) {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return cashClosingRepository
                .existsByStoreIdAndDate(
                        storeId,
                        date
                );
    }

    // =========================
    // HISTÓRICO
    // =========================

    public List<CashClosing> listAll() {

        Long storeId =
                currentStoreService
                        .getCurrentStoreId();

        return cashClosingRepository
                .findByStoreIdOrderByDateDesc(
                        storeId
                );
    }

    // =========================
    // AUXILIARES
    // =========================

    private BigDecimal getBigDecimal(
            Map<String, Object> map,
            String key
    ) {

        Object value =
                map.get(
                        key
                );

        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }

        return new BigDecimal(
                value.toString()
        );
    }

    private Long getLong(
            Map<String, Object> map,
            String key
    ) {

        Object value =
                map.get(
                        key
                );

        if (value == null) {
            return 0L;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        return Long.parseLong(
                value.toString()
        );
    }

    @SuppressWarnings("unchecked")
    private Map<?, ?> getMap(
            Map<String, Object> map,
            String key
    ) {

        Object value =
                map.get(
                        key
                );

        if (
                value instanceof Map<?, ?>
        ) {
            return (Map<?, ?>) value;
        }

        throw new RuntimeException(
                "Dados financeiros inválidos para "
                        + key
        );
    }

    private BigDecimal getBigDecimalFromMap(
            Map<?, ?> map,
            String key
    ) {

        Object value =
                map.get(
                        key
                );

        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }

        return new BigDecimal(
                value.toString()
        );
    }
}