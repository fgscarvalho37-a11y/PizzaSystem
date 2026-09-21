package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.entity.PasswordResetCode;
import com.pizzasystem.backend.repository.CustomerRepository;
import com.pizzasystem.backend.repository.PasswordResetCodeRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class PasswordResetService {

    private static final int CODE_EXPIRATION_MINUTES = 15;

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final PasswordResetCodeRepository
            passwordResetCodeRepository;

    private final CustomerRepository
            customerRepository;

    private final PasswordEncoder
            passwordEncoder;

    private final EmailService
            emailService;

    private final SecureRandom secureRandom =
            new SecureRandom();

    public PasswordResetService(
            PasswordResetCodeRepository passwordResetCodeRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService
    ) {
        this.passwordResetCodeRepository =
                passwordResetCodeRepository;

        this.customerRepository =
                customerRepository;

        this.passwordEncoder =
                passwordEncoder;

        this.emailService =
                emailService;
    }

    @Transactional
    public void requestReset(
            String email
    ) {
        String normalizedEmail =
                normalizeEmail(email);

        if (normalizedEmail == null) {
            return;
        }

        Customer customer =
                customerRepository
                        .findByEmailIgnoreCase(
                                normalizedEmail
                        )
                        .orElse(null);

        /*
         * Não revelamos se o e-mail existe.
         *
         * O controller poderá sempre responder com
         * a mesma mensagem para evitar enumeração
         * de contas.
         */
        if (customer == null) {
            return;
        }

        if (!customer.isActive()) {
            return;
        }

        invalidatePreviousCodes(customer);

        String code =
                generateSixDigitCode();

        PasswordResetCode resetCode =
                new PasswordResetCode();

        resetCode.setCustomer(customer);
        resetCode.setCode(code);

        resetCode.setExpiresAt(
                LocalDateTime.now()
                        .plusMinutes(
                                CODE_EXPIRATION_MINUTES
                        )
        );

        resetCode.setUsed(false);

        passwordResetCodeRepository.save(
                resetCode
        );

        try {
            emailService.sendPasswordResetCode(
                    customer.getEmail(),
                    customer.getName(),
                    code
            );

        } catch (RuntimeException exception) {

            resetCode.markAsUsed();

            passwordResetCodeRepository.save(
                    resetCode
            );

            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public boolean validateCode(
            String email,
            String code
    ) {
        String normalizedEmail =
                normalizeEmail(email);

        String normalizedCode =
                normalizeCode(code);

        if (
                normalizedEmail == null ||
                normalizedCode == null
        ) {
            return false;
        }

        Customer customer =
                customerRepository
                        .findByEmailIgnoreCase(
                                normalizedEmail
                        )
                        .orElse(null);

        if (
                customer == null ||
                !customer.isActive()
        ) {
            return false;
        }

        PasswordResetCode resetCode =
                passwordResetCodeRepository
                        .findFirstByCustomerAndCodeAndUsedFalseOrderByCreatedAtDesc(
                                customer,
                                normalizedCode
                        )
                        .orElse(null);

        if (resetCode == null) {
            return false;
        }

        return resetCode.isValid();
    }

    @Transactional
    public void resetPassword(
            String email,
            String code,
            String newPassword
    ) {
        String normalizedEmail =
                normalizeEmail(email);

        String normalizedCode =
                normalizeCode(code);

        if (normalizedEmail == null) {
            throw new IllegalArgumentException(
                    "Informe um e-mail válido."
            );
        }

        if (normalizedCode == null) {
            throw new IllegalArgumentException(
                    "Código de recuperação inválido."
            );
        }

        validatePassword(newPassword);

        Customer customer =
                customerRepository
                        .findByEmailIgnoreCase(
                                normalizedEmail
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Código de recuperação inválido ou expirado."
                                        )
                        );

        if (!customer.isActive()) {
            throw new IllegalArgumentException(
                    "Código de recuperação inválido ou expirado."
            );
        }

        PasswordResetCode resetCode =
                passwordResetCodeRepository
                        .findFirstByCustomerAndCodeAndUsedFalseOrderByCreatedAtDesc(
                                customer,
                                normalizedCode
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Código de recuperação inválido ou expirado."
                                        )
                        );

        if (resetCode.isExpired()) {

            resetCode.markAsUsed();

            passwordResetCodeRepository.save(
                    resetCode
            );

            throw new IllegalArgumentException(
                    "Código de recuperação inválido ou expirado."
            );
        }

        if (!resetCode.isValid()) {
            throw new IllegalArgumentException(
                    "Código de recuperação inválido ou expirado."
            );
        }

        customer.setPasswordHash(
                passwordEncoder.encode(
                        newPassword
                )
        );

        customerRepository.save(
                customer
        );

        resetCode.markAsUsed();

        passwordResetCodeRepository.save(
                resetCode
        );

        invalidatePreviousCodes(
                customer
        );
    }

    private void invalidatePreviousCodes(
            Customer customer
    ) {
        List<PasswordResetCode> activeCodes =
                passwordResetCodeRepository
                        .findAllByCustomerAndUsedFalse(
                                customer
                        );

        if (activeCodes.isEmpty()) {
            return;
        }

        for (
                PasswordResetCode resetCode
                : activeCodes
        ) {
            resetCode.markAsUsed();
        }

        passwordResetCodeRepository.saveAll(
                activeCodes
        );
    }

    private String generateSixDigitCode() {

        int number =
                secureRandom.nextInt(
                        1_000_000
                );

        return String.format(
                "%06d",
                number
        );
    }

    private String normalizeEmail(
            String email
    ) {
        if (email == null) {
            return null;
        }

        String normalized =
                email.trim()
                        .toLowerCase(
                                Locale.ROOT
                        );

        if (
                normalized.isBlank() ||
                !normalized.contains("@")
        ) {
            return null;
        }

        return normalized;
    }

    private String normalizeCode(
            String code
    ) {
        if (code == null) {
            return null;
        }

        String normalized =
                code.trim();

        if (!normalized.matches("\\d{6}")) {
            return null;
        }

        return normalized;
    }

    private void validatePassword(
            String password
    ) {
        if (
                password == null ||
                password.length() <
                        MIN_PASSWORD_LENGTH
        ) {
            throw new IllegalArgumentException(
                    "A nova senha deve ter pelo menos 8 caracteres."
            );
        }
    }
}