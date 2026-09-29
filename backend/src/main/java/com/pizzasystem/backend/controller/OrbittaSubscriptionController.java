package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.service.CurrentStoreService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/orbitta")
public class OrbittaSubscriptionController {

    private final CurrentStoreService currentStoreService;

    public OrbittaSubscriptionController(
            CurrentStoreService currentStoreService
    ) {
        this.currentStoreService =
                currentStoreService;
    }

    @GetMapping("/subscription")
    public SubscriptionStatusResponse subscription() {

        Store store =
                currentStoreService
                        .getCurrentStore();

        return new SubscriptionStatusResponse(
                store.getOrbittaProductId() != null,
                store.getPlan(),
                store.getSubscriptionStatus(),
                store.getOrbittaRenewalDate()
        );
    }

    public record SubscriptionStatusResponse(
            boolean managedByOrbitta,
            String plan,
            String status,
            LocalDate renewalDate
    ) {
    }
}
