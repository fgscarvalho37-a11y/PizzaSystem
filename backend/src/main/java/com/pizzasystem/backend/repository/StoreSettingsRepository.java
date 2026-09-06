package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingsRepository
        extends JpaRepository<StoreSettings, Long> {
}