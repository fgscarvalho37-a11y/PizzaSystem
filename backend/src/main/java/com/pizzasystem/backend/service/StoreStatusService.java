package com.pizzasystem.backend.service;

import com.pizzasystem.backend.dto.StoreStatusResponse;
import com.pizzasystem.backend.entity.BusinessHours;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.BusinessHoursRepository;
import com.pizzasystem.backend.repository.OrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Service
public class StoreStatusService {

    private final BusinessHoursRepository
            businessHoursRepository;

    private final OrderRepository
            orderRepository;

    private final PublicStoreService
            publicStoreService;

    private static final ZoneId STORE_ZONE =
            ZoneId.of(
                    "America/Sao_Paulo"
            );

    public StoreStatusService(
            BusinessHoursRepository businessHoursRepository,
            OrderRepository orderRepository,
            PublicStoreService publicStoreService
    ) {

        this.businessHoursRepository =
                businessHoursRepository;

        this.orderRepository =
                orderRepository;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // STATUS PELO SLUG
    // =========================

    @Transactional(readOnly = true)
    public StoreStatusResponse getStatus(
            String storeSlug
    ) {

        Store store =
                publicStoreService
                        .getBySlug(
                                storeSlug
                        );

        return getStatus(
                store
        );
    }

    // =========================
    // STATUS PELA STORE
    // =========================

    @Transactional(readOnly = true)
    public StoreStatusResponse getStatus(
            Store store
    ) {

        if (store == null
                || store.getId() == null) {

            throw new RuntimeException(
                    "Loja inválida."
            );
        }

        long ordersToday =
                countOrdersToday(
                        store.getId()
                );

        Integer dailyLimit =
                store.getDailyOrderLimit();

        // =========================
        // FECHAMENTO MANUAL
        // =========================

        if (!store.isOpen()) {

            return new StoreStatusResponse(
                    store.getName(),
                    false,
                    false,
                    "Pedidos fechados manualmente",
                    ordersToday,
                    dailyLimit
            );
        }

        // =========================
        // LIMITE DIÁRIO
        // =========================

        if (dailyLimit != null
                && dailyLimit > 0
                && ordersToday >= dailyLimit) {

            return new StoreStatusResponse(
                    store.getName(),
                    true,
                    false,
                    "Limite diário de pedidos atingido",
                    ordersToday,
                    dailyLimit
            );
        }

        // =========================
        // HORÁRIO
        // =========================

        ZonedDateTime now =
                ZonedDateTime.now(
                        STORE_ZONE
                );

        DayOfWeek today =
                now.getDayOfWeek();

        LocalTime currentTime =
                now.toLocalTime();

        boolean insideBusinessHours =
                isInsideBusinessHours(
                        store.getId(),
                        today,
                        currentTime
                );

        if (!insideBusinessHours) {

            return new StoreStatusResponse(
                    store.getName(),
                    true,
                    false,
                    "Fora do horário de funcionamento",
                    ordersToday,
                    dailyLimit
            );
        }

        // =========================
        // RECEBENDO PEDIDOS
        // =========================

        return new StoreStatusResponse(
                store.getName(),
                true,
                true,
                "Recebendo pedidos",
                ordersToday,
                dailyLimit
        );
    }

    // =========================
    // PODE RECEBER - SLUG
    // =========================

    @Transactional(readOnly = true)
    public boolean canReceiveOrders(
            String storeSlug
    ) {

        return getStatus(
                storeSlug
        ).open();
    }

    // =========================
    // PODE RECEBER - STORE
    // =========================

    @Transactional(readOnly = true)
    public boolean canReceiveOrders(
            Store store
    ) {

        return getStatus(
                store
        ).open();
    }

    // =========================
    // CONTAR PEDIDOS DO DIA
    // =========================

    private long countOrdersToday(
            Long storeId
    ) {

        LocalDate today =
                LocalDate.now(
                        STORE_ZONE
                );

        LocalDateTime start =
                today.atStartOfDay();

        LocalDateTime end =
                today
                        .plusDays(1)
                        .atStartOfDay();

        return orderRepository
                .countByStoreIdAndPaymentStatusAndCreatedAtBetween(
                        storeId,
                        PaymentStatus.APPROVED,
                        start,
                        end
                );
    }

    // =========================
    // VERIFICAR HORÁRIO
    // =========================

    private boolean isInsideBusinessHours(
            Long storeId,
            DayOfWeek today,
            LocalTime currentTime
    ) {

        Optional<BusinessHours>
                todayHoursOptional =
                businessHoursRepository
                        .findByStoreIdAndDayOfWeek(
                                storeId,
                                today
                        );

        // =========================
        // HORÁRIO DE HOJE
        // =========================

        if (todayHoursOptional.isPresent()) {

            BusinessHours todayHours =
                    todayHoursOptional.get();

            if (todayHours.isEnabled()
                    && todayHours.getOpeningTime() != null
                    && todayHours.getClosingTime() != null) {

                LocalTime opening =
                        todayHours
                                .getOpeningTime();

                LocalTime closing =
                        todayHours
                                .getClosingTime();

                // MESMO HORÁRIO = 24 HORAS

                if (opening.equals(
                        closing
                )) {

                    return true;
                }

                // HORÁRIO NORMAL
                // EX: 18:00 -> 23:00

                if (opening.isBefore(
                        closing
                )) {

                    if (!currentTime.isBefore(
                            opening
                    )
                            && currentTime.isBefore(
                            closing
                    )) {

                        return true;
                    }
                }

                // ATRAVESSA MEIA-NOITE
                // EX: 18:00 -> 02:00

                if (opening.isAfter(
                        closing
                )) {

                    if (!currentTime.isBefore(
                            opening
                    )) {

                        return true;
                    }
                }
            }
        }

        // =========================
        // HORÁRIO DO DIA ANTERIOR
        // =========================

        DayOfWeek yesterday =
                today.minus(1);

        Optional<BusinessHours>
                yesterdayHoursOptional =
                businessHoursRepository
                        .findByStoreIdAndDayOfWeek(
                                storeId,
                                yesterday
                        );

        if (yesterdayHoursOptional.isPresent()) {

            BusinessHours yesterdayHours =
                    yesterdayHoursOptional.get();

            if (yesterdayHours.isEnabled()
                    && yesterdayHours.getOpeningTime() != null
                    && yesterdayHours.getClosingTime() != null) {

                LocalTime opening =
                        yesterdayHours
                                .getOpeningTime();

                LocalTime closing =
                        yesterdayHours
                                .getClosingTime();

                if (opening.isAfter(
                        closing
                )
                        && currentTime.isBefore(
                        closing
                )) {

                    return true;
                }
            }
        }

        return false;
    }
}