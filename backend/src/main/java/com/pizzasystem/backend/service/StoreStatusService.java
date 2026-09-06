package com.pizzasystem.backend.service;

import com.pizzasystem.backend.dto.StoreStatusResponse;
import com.pizzasystem.backend.entity.BusinessHours;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.StoreSettings;
import com.pizzasystem.backend.repository.BusinessHoursRepository;
import com.pizzasystem.backend.repository.OrderRepository;
import com.pizzasystem.backend.repository.StoreSettingsRepository;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Service
public class StoreStatusService {

    private final StoreSettingsRepository storeSettingsRepository;
    private final BusinessHoursRepository businessHoursRepository;
    private final OrderRepository orderRepository;

    private static final ZoneId STORE_ZONE =
            ZoneId.of("America/Sao_Paulo");

    public StoreStatusService(
            StoreSettingsRepository storeSettingsRepository,
            BusinessHoursRepository businessHoursRepository,
            OrderRepository orderRepository
    ) {
        this.storeSettingsRepository =
                storeSettingsRepository;

        this.businessHoursRepository =
                businessHoursRepository;

        this.orderRepository =
                orderRepository;
    }

    // =========================
    // STATUS DA LOJA
    // =========================

    public StoreStatusResponse getStatus() {

        StoreSettings settings =
                storeSettingsRepository
                        .findById(1L)
                        .orElseGet(() -> {

                            StoreSettings newSettings =
                                    new StoreSettings();

                            newSettings.setId(1L);

                            newSettings.setOpen(
                                    false
                            );

                            return storeSettingsRepository
                                    .save(
                                            newSettings
                                    );
                        });

        long ordersToday =
                countOrdersToday();

        Integer dailyLimit =
                settings.getDailyOrderLimit();

        // =========================
        // FECHAMENTO MANUAL
        // =========================

        if (!settings.isOpen()) {

            return new StoreStatusResponse(
                    settings.getStoreName(),
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
                    settings.getStoreName(),
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
                        today,
                        currentTime
                );

        if (!insideBusinessHours) {

            return new StoreStatusResponse(
                    settings.getStoreName(),
                    true,
                    false,
                    "Fora do horário de funcionamento",
                    ordersToday,
                    dailyLimit
            );
        }

        // =========================
        // ABERTO
        // =========================

        return new StoreStatusResponse(
                settings.getStoreName(),
                true,
                true,
                "Recebendo pedidos",
                ordersToday,
                dailyLimit
        );
    }

    // =========================
    // PODE RECEBER PEDIDOS
    // =========================

    public boolean canReceiveOrders() {

        return getStatus()
                .open();
    }

    // =========================
    // CONTAR PEDIDOS DO DIA
    // =========================

    private long countOrdersToday() {

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

        /*
         * IMPORTANTE:
         *
         * Agora o limite diário conta somente
         * pedidos com pagamento APROVADO.
         *
         * Isso evita que:
         *
         * - pedido abandonado
         * - pagamento recusado
         * - pagamento pendente
         * - tentativa de cartão que falhou
         *
         * consumam uma vaga do limite diário.
         */
        return orderRepository
                .countByPaymentStatusAndCreatedAtBetween(
                        PaymentStatus.APPROVED,
                        start,
                        end
                );
    }

    // =========================
    // VERIFICAR HORÁRIO
    // =========================

    private boolean isInsideBusinessHours(
            DayOfWeek today,
            LocalTime currentTime
    ) {

        Optional<BusinessHours>
                todayHoursOptional =
                businessHoursRepository
                        .findByDayOfWeek(
                                today
                        );

        // =========================
        // HORÁRIO DO DIA ATUAL
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

                /*
                 * Mesmo horário de abertura
                 * e fechamento = 24 horas.
                 */
                if (opening.equals(
                        closing
                )) {

                    return true;
                }

                /*
                 * Exemplo:
                 *
                 * 18:00 até 23:00
                 */
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

                /*
                 * Horário atravessa meia-noite.
                 *
                 * Exemplo:
                 *
                 * 18:00 até 02:00
                 */
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

        /*
         * Essa parte cobre horários que
         * atravessam a meia-noite.
         *
         * Exemplo:
         *
         * Sexta:
         * 18:00 até 02:00
         *
         * À 01:00 de sábado,
         * ainda estamos dentro do
         * horário de sexta-feira.
         */

        DayOfWeek yesterday =
                today.minus(1);

        Optional<BusinessHours>
                yesterdayHoursOptional =
                businessHoursRepository
                        .findByDayOfWeek(
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