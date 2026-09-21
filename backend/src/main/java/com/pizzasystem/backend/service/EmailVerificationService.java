package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.EmailVerificationCode;
import com.pizzasystem.backend.repository.CustomerRepository;
import com.pizzasystem.backend.repository.EmailVerificationCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmailVerificationService {

    private static final int CODE_EXPIRATION_MINUTES = 15;

    private final EmailVerificationCodeRepository verificationCodeRepository;
    private final CustomerRepository customerRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
            EmailVerificationCodeRepository verificationCodeRepository,
            CustomerRepository customerRepository,
            EmailService emailService
    ) {
        this.verificationCodeRepository = verificationCodeRepository;
        this.customerRepository = customerRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void sendCode(Long customerId) {
        Customer customer = findCustomer(customerId);

        validateCustomerForVerification(customer);

        invalidatePreviousCodes(customer);

        String code = generateSixDigitCode();

        EmailVerificationCode verificationCode =
                new EmailVerificationCode();

        verificationCode.setCustomer(customer);
        verificationCode.setCode(code);
        verificationCode.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(CODE_EXPIRATION_MINUTES)
        );
        verificationCode.setUsed(false);

        verificationCodeRepository.save(verificationCode);

        try {
            emailService.sendVerificationCode(
                    customer.getEmail(),
                    customer.getName(),
                    code
            );
        } catch (RuntimeException exception) {
            verificationCode.markAsUsed();
            verificationCodeRepository.save(verificationCode);

            throw exception;
        }
    }

    @Transactional
    public void resendCode(Long customerId) {
        sendCode(customerId);
    }

    @Transactional
    public Customer verify(
            Long customerId,
            String code
    ) {
        Customer customer = findCustomer(customerId);

        if (!customer.isActive()) {
            throw new IllegalArgumentException(
                    "Esta conta está desativada."
            );
        }

        if (customer.isEmailVerified()) {
            return customer;
        }

        String normalizedCode =
                code == null
                        ? ""
                        : code.trim();

        if (!normalizedCode.matches("\\d{6}")) {
            throw new IllegalArgumentException(
                    "Informe um código de 6 dígitos."
            );
        }

        EmailVerificationCode verificationCode =
                verificationCodeRepository
                        .findFirstByCustomerAndCodeAndUsedFalseOrderByCreatedAtDesc(
                                customer,
                                normalizedCode
                        )
                        .orElseThrow(
                                () -> new IllegalArgumentException(
                                        "Código de verificação inválido."
                                )
                        );

        if (verificationCode.isExpired()) {
            verificationCode.markAsUsed();
            verificationCodeRepository.save(verificationCode);

            throw new IllegalArgumentException(
                    "Este código expirou. Solicite um novo código."
            );
        }

        verificationCode.markAsUsed();

        customer.setEmailVerified(true);

        verificationCodeRepository.save(verificationCode);
        customerRepository.save(customer);

        invalidatePreviousCodes(customer);

        return customer;
    }

    @Transactional
    public void invalidatePreviousCodes(
            Customer customer
    ) {
        List<EmailVerificationCode> activeCodes =
                verificationCodeRepository
                        .findAllByCustomerAndUsedFalse(customer);

        if (activeCodes.isEmpty()) {
            return;
        }

        for (EmailVerificationCode activeCode : activeCodes) {
            activeCode.markAsUsed();
        }

        verificationCodeRepository.saveAll(activeCodes);
    }

    private void validateCustomerForVerification(
            Customer customer
    ) {
        if (!customer.isActive()) {
            throw new IllegalArgumentException(
                    "Esta conta está desativada."
            );
        }

        if (customer.isEmailVerified()) {
            throw new IllegalArgumentException(
                    "Este e-mail já foi verificado."
            );
        }

        if (customer.getEmail() == null
                || customer.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Esta conta não possui um e-mail válido."
            );
        }
    }

    private Customer findCustomer(Long customerId) {
        if (customerId == null) {
            throw new IllegalArgumentException(
                    "Cliente inválido."
            );
        }

        return customerRepository
                .findById(customerId)
                .orElseThrow(
                        () -> new IllegalArgumentException(
                                "Cliente não encontrado."
                        )
                );
    }

    private String generateSixDigitCode() {
        int number = secureRandom.nextInt(1_000_000);

        return String.format(
                "%06d",
                number
        );
    }
}