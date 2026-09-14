package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.Customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmailIgnoreCase(
            String email
    );

    Optional<Customer> findByGoogleId(
            String googleId
    );

    boolean existsByEmailIgnoreCase(
            String email
    );
}