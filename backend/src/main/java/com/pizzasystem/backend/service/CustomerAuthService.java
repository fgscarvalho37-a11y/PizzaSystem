package com.pizzasystem.backend.service;

import com.pizzasystem.backend.dto.CustomerLoginRequest;
import com.pizzasystem.backend.dto.CustomerRegisterRequest;
import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.repository.CustomerRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CustomerAuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomerAuthService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.customerRepository =
                customerRepository;

        this.passwordEncoder =
                passwordEncoder;
    }

    // =========================
    // CADASTRO
    // =========================

    public Customer register(
            CustomerRegisterRequest request
    ) {

        if (request == null) {

            throw new RuntimeException(
                    "Dados não informados"
            );
        }

        if (request.getName() == null
                || request.getName().isBlank()) {

            throw new RuntimeException(
                    "Nome não informado"
            );
        }

        if (request.getEmail() == null
                || request.getEmail().isBlank()) {

            throw new RuntimeException(
                    "E-mail não informado"
            );
        }

        if (request.getPassword() == null
                || request.getPassword().length() < 8) {

            throw new RuntimeException(
                    "A senha deve ter pelo menos 8 caracteres"
            );
        }

        String email =
                request
                        .getEmail()
                        .trim()
                        .toLowerCase();

        if (customerRepository
                .existsByEmailIgnoreCase(
                        email
                )) {

            throw new RuntimeException(
                    "Já existe uma conta com este e-mail"
            );
        }

        Customer customer =
                new Customer();

        customer.setName(
                request
                        .getName()
                        .trim()
        );

        customer.setEmail(
                email
        );

        customer.setPhone(
                request.getPhone() != null
                        && !request
                        .getPhone()
                        .isBlank()
                        ? request
                        .getPhone()
                        .trim()
                        : null
        );

        customer.setPasswordHash(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        customer.setEmailVerified(
                false
        );

        customer.setActive(
                true
        );

        customer.setLastLoginAt(
                LocalDateTime.now()
        );

        return customerRepository.save(
                customer
        );
    }

    // =========================
    // LOGIN
    // =========================

    public Customer login(
            CustomerLoginRequest request
    ) {

        if (request == null
                || request.getEmail() == null
                || request.getEmail().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {

            throw new RuntimeException(
                    "E-mail ou senha inválidos"
            );
        }

        Customer customer =
                customerRepository
                        .findByEmailIgnoreCase(
                                request
                                        .getEmail()
                                        .trim()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "E-mail ou senha inválidos"
                                )
                        );

        if (!customer.isActive()) {

            throw new RuntimeException(
                    "Conta desativada"
            );
        }

        if (customer.getPasswordHash() == null
                || customer
                .getPasswordHash()
                .isBlank()) {

            throw new RuntimeException(
                    "Esta conta não possui senha cadastrada"
            );
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                customer.getPasswordHash()
        )) {

            throw new RuntimeException(
                    "E-mail ou senha inválidos"
            );
        }

        customer.setLastLoginAt(
                LocalDateTime.now()
        );

        return customerRepository.save(
                customer
        );
    }

    // =========================
    // BUSCAR POR ID
    // =========================

    public Customer findById(
            Long id
    ) {

        return customerRepository
                .findById(
                        id
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cliente não encontrado"
                        )
                );
    }

    // =========================
    // BUSCAR POR E-MAIL
    // =========================

    public Customer findByEmail(
            String email
    ) {

        if (email == null
                || email.isBlank()) {

            throw new RuntimeException(
                    "Cliente não encontrado"
            );
        }

        return customerRepository
                .findByEmailIgnoreCase(
                        email.trim()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Cliente não encontrado"
                        )
                );
    }
}