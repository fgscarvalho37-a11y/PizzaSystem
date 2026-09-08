package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.entity.CouponDiscountType;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.PaymentStatus;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.CouponRepository;
import com.pizzasystem.backend.repository.OrderRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponService {

    private final CouponRepository
            couponRepository;

    private final OrderRepository
            orderRepository;

    private final CurrentStoreService
            currentStoreService;

    public CouponService(
            CouponRepository couponRepository,
            OrderRepository orderRepository,
            CurrentStoreService currentStoreService
    ) {

        this.couponRepository =
                couponRepository;

        this.orderRepository =
                orderRepository;

        this.currentStoreService =
                currentStoreService;
    }

    // =========================
    // LISTAR - ADMIN
    // =========================

    @Transactional(readOnly = true)
    public List<Coupon> listAll() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return couponRepository
                .findByStoreIdOrderByCreatedAtDesc(
                        store.getId()
                );
    }

    // =========================
    // BUSCAR POR ID - ADMIN
    // =========================

    @Transactional(readOnly = true)
    public Coupon findById(
            Long id
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return couponRepository
                .findByIdAndStoreId(
                        id,
                        store.getId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cupom não encontrado"
                        )
                );
    }

    // =========================
    // CRIAR - ADMIN
    // =========================

    @Transactional
    public Coupon create(
            Coupon coupon
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        validateCoupon(
                coupon,
                null,
                store
        );

        normalizeCoupon(
                coupon
        );

        coupon.setId(
                null
        );

        coupon.setStore(
                store
        );

        coupon.setUsageCount(
                0
        );

        return couponRepository
                .save(
                        coupon
                );
    }

    // =========================
    // ATUALIZAR - ADMIN
    // =========================

    @Transactional
    public Coupon update(
            Long id,
            Coupon request
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        Coupon existing =
                couponRepository
                        .findByIdAndStoreId(
                                id,
                                store.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cupom não encontrado"
                                )
                        );

        validateCoupon(
                request,
                id,
                store
        );

        existing.setCode(
                normalizeCode(
                        request.getCode()
                )
        );

        existing.setDiscountType(
                request.getDiscountType()
        );

        existing.setDiscountValue(
                request.getDiscountValue()
        );

        existing.setMinimumOrderValue(
                normalizeOptionalMoney(
                        request.getMinimumOrderValue()
                )
        );

        existing.setMaximumDiscountValue(
                normalizeOptionalMoney(
                        request.getMaximumDiscountValue()
                )
        );

        existing.setActive(
                request.isActive()
        );

        existing.setValidFrom(
                request.getValidFrom()
        );

        existing.setValidUntil(
                request.getValidUntil()
        );

        existing.setUsageLimit(
                normalizeUsageLimit(
                        request.getUsageLimit()
                )
        );

        return couponRepository
                .save(
                        existing
                );
    }

    // =========================
    // ATIVAR / DESATIVAR
    // =========================

    @Transactional
    public Coupon changeActive(
            Long id,
            boolean active
    ) {

        Coupon coupon =
                findById(
                        id
                );

        coupon.setActive(
                active
        );

        return couponRepository
                .save(
                        coupon
                );
    }

    // =========================
    // VALIDAR NO CHECKOUT
    // =========================

    /*
     * Esta é a versão SaaS.
     *
     * O mesmo código pode existir em
     * pizzarias diferentes.
     */
    @Transactional(readOnly = true)
    public Coupon validateForOrder(
            Store store,
            String code,
            BigDecimal orderValue
    ) {

        if (store == null
                || store.getId() == null) {

            throw new RuntimeException(
                    "Loja inválida"
            );
        }

        if (code == null
                || code.isBlank()) {

            throw new RuntimeException(
                    "Código do cupom não informado"
            );
        }

        if (orderValue == null
                || orderValue.compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new RuntimeException(
                    "Valor do pedido inválido"
            );
        }

        Coupon coupon =
                couponRepository
                        .findByStoreIdAndCodeIgnoreCase(
                                store.getId(),
                                normalizeCode(
                                        code
                                )
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cupom inválido"
                                )
                        );

        validateCouponAvailability(
                coupon,
                orderValue
        );

        return coupon;
    }

    // =========================
    // COMPATIBILIDADE TEMPORÁRIA
    // =========================

    /*
     * Mantido temporariamente para não
     * quebrar código antigo enquanto o
     * checkout é migrado.
     */
    @Transactional(readOnly = true)
    public Coupon validateForOrder(
            String code,
            BigDecimal orderValue
    ) {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return validateForOrder(
                store,
                code,
                orderValue
        );
    }

    // =========================
    // VALIDAR DISPONIBILIDADE
    // =========================

    private void validateCouponAvailability(
            Coupon coupon,
            BigDecimal orderValue
    ) {

        if (!coupon.isActive()) {

            throw new RuntimeException(
                    "Este cupom está inativo"
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        if (coupon.getValidFrom() != null
                && now.isBefore(
                        coupon.getValidFrom()
                )) {

            throw new RuntimeException(
                    "Este cupom ainda não está válido"
            );
        }

        if (coupon.getValidUntil() != null
                && now.isAfter(
                        coupon.getValidUntil()
                )) {

            throw new RuntimeException(
                    "Este cupom expirou"
            );
        }

        if (coupon.getUsageLimit() != null
                && coupon.getUsageLimit() > 0
                && coupon.getUsageCount() >=
                coupon.getUsageLimit()) {

            throw new RuntimeException(
                    "Este cupom atingiu o limite de usos"
            );
        }

        if (coupon.getMinimumOrderValue() != null
                && orderValue.compareTo(
                        coupon.getMinimumOrderValue()
                ) < 0) {

            throw new RuntimeException(
                    "Valor mínimo do pedido para este cupom: R$ "
                            + coupon
                            .getMinimumOrderValue()
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            )
                            .toPlainString()
            );
        }
    }

    // =========================
    // CALCULAR DESCONTO
    // =========================

    public BigDecimal calculateDiscount(
            Coupon coupon,
            BigDecimal orderValue
    ) {

        if (coupon == null) {
            return BigDecimal.ZERO;
        }

        if (orderValue == null
                || orderValue.compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            return BigDecimal.ZERO;
        }

        BigDecimal discount;

        if (coupon.getDiscountType()
                == CouponDiscountType.PERCENTAGE) {

            discount =
                    orderValue
                            .multiply(
                                    coupon.getDiscountValue()
                            )
                            .divide(
                                    BigDecimal.valueOf(
                                            100
                                    ),
                                    2,
                                    RoundingMode.HALF_UP
                            );

            if (coupon.getMaximumDiscountValue()
                    != null
                    && discount.compareTo(
                            coupon.getMaximumDiscountValue()
                    ) > 0) {

                discount =
                        coupon
                                .getMaximumDiscountValue();
            }

        } else {

            discount =
                    coupon
                            .getDiscountValue();
        }

        if (discount.compareTo(
                orderValue
        ) > 0) {

            discount =
                    orderValue;
        }

        if (discount.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            return BigDecimal.ZERO;
        }

        return discount.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    // =========================
    // REGISTRAR USO DIRETO
    // =========================

    @Transactional
    public void registerUsage(
            Coupon coupon
    ) {

        if (coupon == null) {
            return;
        }

        Integer current =
                coupon.getUsageCount();

        if (current == null) {
            current =
                    0;
        }

        coupon.setUsageCount(
                current + 1
        );

        couponRepository.save(
                coupon
        );
    }

    // =========================
    // REGISTRAR USO DO PEDIDO
    // =========================

    @Transactional
    public void registerUsageForOrder(
            Order order
    ) {

        if (order == null) {
            return;
        }

        if (order.getPaymentStatus()
                != PaymentStatus.APPROVED) {

            return;
        }

        if (order.getCouponCode() == null
                || order.getCouponCode()
                .isBlank()) {

            return;
        }

        if (order.isCouponUsageRegistered()) {
            return;
        }

        if (order.getStore() == null
                || order.getStore().getId()
                == null) {

            throw new RuntimeException(
                    "Pedido sem loja vinculada"
            );
        }

        Coupon coupon =
                couponRepository
                        .findByStoreIdAndCodeIgnoreCase(
                                order
                                        .getStore()
                                        .getId(),
                                normalizeCode(
                                        order
                                                .getCouponCode()
                                )
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Cupom do pedido não encontrado"
                                )
                        );

        Integer current =
                coupon.getUsageCount();

        if (current == null) {
            current =
                    0;
        }

        coupon.setUsageCount(
                current + 1
        );

        couponRepository.save(
                coupon
        );

        order.setCouponUsageRegistered(
                true
        );

        orderRepository.save(
                order
        );
    }

    // =========================
    // VALIDAÇÃO DE CADASTRO
    // =========================

    private void validateCoupon(
            Coupon coupon,
            Long currentId,
            Store store
    ) {

        if (coupon == null) {

            throw new RuntimeException(
                    "Dados do cupom não informados"
            );
        }

        if (coupon.getCode() == null
                || coupon.getCode()
                .isBlank()) {

            throw new RuntimeException(
                    "Código do cupom é obrigatório"
            );
        }

        String normalizedCode =
                normalizeCode(
                        coupon.getCode()
                );

        couponRepository
                .findByStoreIdAndCodeIgnoreCase(
                        store.getId(),
                        normalizedCode
                )
                .ifPresent(existing -> {

                    if (currentId == null
                            || !existing
                            .getId()
                            .equals(
                                    currentId
                            )) {

                        throw new RuntimeException(
                                "Já existe um cupom com este código"
                        );
                    }
                });

        if (coupon.getDiscountType()
                == null) {

            throw new RuntimeException(
                    "Tipo de desconto é obrigatório"
            );
        }

        if (coupon.getDiscountValue() == null
                || coupon
                .getDiscountValue()
                .compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            throw new RuntimeException(
                    "Valor do desconto deve ser maior que zero"
            );
        }

        if (coupon.getDiscountType()
                == CouponDiscountType.PERCENTAGE
                && coupon
                .getDiscountValue()
                .compareTo(
                        BigDecimal.valueOf(
                                100
                        )
                ) > 0) {

            throw new RuntimeException(
                    "O desconto percentual não pode ser maior que 100%"
            );
        }

        if (coupon.getMinimumOrderValue()
                != null
                && coupon
                .getMinimumOrderValue()
                .compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new RuntimeException(
                    "Valor mínimo não pode ser negativo"
            );
        }

        if (coupon.getMaximumDiscountValue()
                != null
                && coupon
                .getMaximumDiscountValue()
                .compareTo(
                        BigDecimal.ZERO
                ) <= 0) {

            throw new RuntimeException(
                    "Limite máximo de desconto deve ser maior que zero"
            );
        }

        if (coupon.getUsageLimit() != null
                && coupon.getUsageLimit()
                < 0) {

            throw new RuntimeException(
                    "Limite de usos não pode ser negativo"
            );
        }

        if (coupon.getValidFrom() != null
                && coupon.getValidUntil()
                != null
                && coupon
                .getValidUntil()
                .isBefore(
                        coupon.getValidFrom()
                )) {

            throw new RuntimeException(
                    "A data final não pode ser anterior à data inicial"
            );
        }
    }

    // =========================
    // NORMALIZAÇÃO
    // =========================

    private void normalizeCoupon(
            Coupon coupon
    ) {

        coupon.setCode(
                normalizeCode(
                        coupon.getCode()
                )
        );

        coupon.setMinimumOrderValue(
                normalizeOptionalMoney(
                        coupon
                                .getMinimumOrderValue()
                )
        );

        coupon.setMaximumDiscountValue(
                normalizeOptionalMoney(
                        coupon
                                .getMaximumDiscountValue()
                )
        );

        coupon.setUsageLimit(
                normalizeUsageLimit(
                        coupon.getUsageLimit()
                )
        );

        if (coupon.getUsageCount()
                == null) {

            coupon.setUsageCount(
                    0
            );
        }
    }

    private String normalizeCode(
            String code
    ) {

        return code
                .trim()
                .toUpperCase();
    }

    private BigDecimal normalizeOptionalMoney(
            BigDecimal value
    ) {

        if (value == null) {
            return null;
        }

        return value.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private Integer normalizeUsageLimit(
            Integer value
    ) {

        if (value == null
                || value == 0) {

            return null;
        }

        return value;
    }
}