package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Coupon;
import com.pizzasystem.backend.service.CouponService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(
            CouponService couponService
    ) {
        this.couponService =
                couponService;
    }

    // =========================
    // LISTAR TODOS
    // =========================

    @GetMapping
    public List<Coupon> listAll() {

        return couponService
                .listAll();
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    @GetMapping("/{id}")
    public Coupon findById(
            @PathVariable Long id
    ) {

        return couponService
                .findById(id);
    }

    // =========================
    // CRIAR
    // =========================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Coupon create(
            @RequestBody Coupon coupon
    ) {

        return couponService
                .create(coupon);
    }

    // =========================
    // ATUALIZAR
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
    // ATIVAR / DESATIVAR
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
    // VALIDAR NO CHECKOUT
    // =========================

    @GetMapping("/validate")
    public Map<String, Object> validateCoupon(
            @RequestParam String code,
            @RequestParam BigDecimal orderValue
    ) {

        Coupon coupon =
                couponService
                        .validateForOrder(
                                code,
                                orderValue
                        );

        BigDecimal discount =
                couponService
                        .calculateDiscount(
                                coupon,
                                orderValue
                        );

        BigDecimal finalValue =
                orderValue.subtract(
                        discount
                );

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