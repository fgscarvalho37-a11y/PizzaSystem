package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.AdminUser;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminUserRepository
        extends JpaRepository<AdminUser, Long> {

    Optional<AdminUser> findByEmailIgnoreCase(
            String email
    );

    boolean existsByEmailIgnoreCase(
            String email
    );

    List<AdminUser> findAllByStoreId(
            Long storeId
    );
}