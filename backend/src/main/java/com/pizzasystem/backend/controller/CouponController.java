package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.service.CouponService;
import com.pizzasystem.backend.service.PublicStoreService;

import org.springframework.http.HttpStatus;

import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService
            couponService;

    private final PublicStoreService
            publicStoreService;

    public CouponController(
            CouponService couponService,
            PublicStoreService publicStoreService
    ) {

        this.couponService =
                couponService;

        this.publicStoreService =
                publicStoreService;
    }

    // =========================
    // ADMIN - LISTAR TODOS
    // =========================

    @GetMapping
    public List<Coupon> listAll() {

        return couponService
                .listAll();
    }

    // =========================
    // ADMIN - BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    public Coupon findById(
            @PathVariable Long id
    ) {

        return couponService
                .findById(
                        id
                );
    }

    // =========================
    // ADMIN - CRIAR
    // =========================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Coupon create(
            @RequestBody Coupon coupon
    ) {

        return couponService
                .create(
                        coupon
                );
    }

    // =========================
    // ADMIN - ATUALIZAR
    // =========================

    @PutMapping("/{id}")
    public Coupon update(
            @PathVariable Long id,
            @RequestBody Coupon coupon
    ) {

        return couponService
                .update(
                        id,
                        coupon
                );
    }

    // =========================
    // ADMIN - ATIVAR / DESATIVAR
    // =========================

    @PatchMapping("/{id}/active")
    public Coupon changeActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {

        return couponService
                .changeActive(
                        id,
                        active
                );
    }

    // =========================
    // PÚBLICO - VALIDAR CUPOM
    // =========================

    /*
     * Exemplo:
     *
     * GET /api/coupons/validate
     * ?store=misterio-do-sabor
     * &code=PIZZA10
     * &orderValue=51.00
     */
    @GetMapping("/validate")
    public Map<String, Object> validateCoupon(
            @RequestParam String store,
            @RequestParam String code,
            @RequestParam BigDecimal orderValue
    ) {

        // =========================
        // RESOLVER STORE
        // =========================

        Store currentStore =
                publicStoreService
                        .getBySlug(
                                store
                        );

        // =========================
        // VALIDAR CUPOM DA STORE
        // =========================

        Coupon coupon =
                couponService
                        .validateForOrder(
                                currentStore,
                                code,
                                orderValue
                        );

        // =========================
        // CALCULAR DESCONTO
        // =========================

        BigDecimal discount =
                couponService
                        .calculateDiscount(
                                coupon,
                                orderValue
                        );

        BigDecimal finalValue =
                orderValue
                        .subtract(
                                discount
                        );

        if (finalValue.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            finalValue =
                    BigDecimal.ZERO;
        }

        // =========================
        // RESPONSE
        // =========================

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "valid",
                true
        );

        response.put(
                "couponId",
                coupon.getId()
        );

        response.put(
                "code",
                coupon.getCode()
        );

        response.put(
                "discountType",
                coupon.getDiscountType()
        );

        response.put(
                "discountValue",
                coupon.getDiscountValue()
        );

        response.put(
                "discount",
                discount
        );

        response.put(
                "originalValue",
                orderValue
        );

        response.put(
                "finalValue",
                finalValue
        );

        return response;
    }
}