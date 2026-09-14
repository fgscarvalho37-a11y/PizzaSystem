package com.pizzasystem.backend.repository;

import com.pizzasystem.backend.entity.CustomerStore;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerStoreRepository
        extends JpaRepository<CustomerStore, Long> {

    Optional<CustomerStore>
    findByCustomerIdAndStoreId(
            Long customerId,
            Long storeId
    );

    List<CustomerStore>
    findByCustomerIdOrderByJoinedAtDesc(
            Long customerId
    );

    List<CustomerStore>
    findByStoreIdOrderByJoinedAtDesc(
            Long storeId
    );

    boolean existsByCustomerIdAndStoreId(
            Long customerId,
            Long storeId
    );
}