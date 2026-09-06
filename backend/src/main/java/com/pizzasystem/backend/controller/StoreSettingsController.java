package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.StoreStatusResponse;
import com.pizzasystem.backend.entity.StoreSettings;
import com.pizzasystem.backend.repository.StoreSettingsRepository;
import com.pizzasystem.backend.service.StoreStatusService;

import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/store")
public class StoreSettingsController {

    private final StoreSettingsRepository repository;
    private final StoreStatusService storeStatusService;

    public StoreSettingsController(
            StoreSettingsRepository repository,
            StoreStatusService storeStatusService
    ) {
        this.repository = repository;
        this.storeStatusService = storeStatusService;
    }

    @GetMapping
    public StoreSettings getSettings() {
        return repository.findById(1L)
                .orElseGet(() -> {
                    StoreSettings settings =
                            new StoreSettings();

                    settings.setId(1L);

                    return repository.save(settings);
                });
    }

    @GetMapping("/status")
    public StoreStatusResponse getStatus() {
        return storeStatusService.getStatus();
    }

    @PutMapping
    public StoreSettings update(
            @RequestBody StoreSettings data
    ) {
        StoreSettings settings =
                repository.findById(1L)
                        .orElseGet(StoreSettings::new);

        settings.setId(1L);
        settings.setStoreName(data.getStoreName());
        settings.setWhatsapp(data.getWhatsapp());
        settings.setOpen(data.isOpen());
        settings.setDailyOrderLimit(
                data.getDailyOrderLimit()
        );

        return repository.save(settings);
    }

    @PatchMapping("/open")
    public StoreSettings changeOpen(
            @RequestParam boolean open
    ) {
        StoreSettings settings =
                repository.findById(1L)
                        .orElseGet(StoreSettings::new);

        settings.setId(1L);
        settings.setOpen(open);

        return repository.save(settings);
    }
}