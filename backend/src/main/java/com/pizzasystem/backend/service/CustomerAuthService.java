package com.pizzasystem.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import com.pizzasystem.backend.dto.CustomerLoginRequest;
import com.pizzasystem.backend.dto.CustomerRegisterRequest;
import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.repository.CustomerRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;

@Service
public class CustomerAuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final String googleClientId;

    public CustomerAuthService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            @Value("${google.oauth.client-id}") String googleClientId
    ) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.googleClientId = googleClientId;
    }

    public Customer register(CustomerRegisterRequest request) {
        if (request == null) {
            throw new RuntimeException("Dados não informados");
        }

        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("Nome não informado");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("E-mail não informado");
        }

        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new RuntimeException("A senha deve ter pelo menos 8 caracteres");
        }

        String email = request.getEmail().trim().toLowerCase();

        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new RuntimeException("Já existe uma conta com este e-mail");
        }

        Customer customer = new Customer();
        customer.setName(request.getName().trim());
        customer.setEmail(email);
        customer.setPhone(
                request.getPhone() != null && !request.getPhone().isBlank()
                        ? request.getPhone().trim()
                        : null
        );
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setEmailVerified(false);
        customer.setActive(true);
        customer.setLastLoginAt(LocalDateTime.now());

        return customerRepository.save(customer);
    }

    public Customer login(CustomerLoginRequest request) {
        if (request == null
                || request.getEmail() == null
                || request.getEmail().isBlank()
                || request.getPassword() == null
                || request.getPassword().isBlank()) {
            throw new RuntimeException("E-mail ou senha inválidos");
        }

        Customer customer = customerRepository
                .findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("E-mail ou senha inválidos"));

        if (!customer.isActive()) {
            throw new RuntimeException("Conta desativada");
        }

        if (customer.getPasswordHash() == null || customer.getPasswordHash().isBlank()) {
            throw new RuntimeException("Esta conta não possui senha cadastrada");
        }

        if (!passwordEncoder.matches(request.getPassword(), customer.getPasswordHash())) {
            throw new RuntimeException("E-mail ou senha inválidos");
        }

        customer.setLastLoginAt(LocalDateTime.now());
        return customerRepository.save(customer);
    }

    // =========================
    // LOGIN COM GOOGLE
    // =========================

    public Customer loginWithGoogle(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new RuntimeException("Credencial do Google não informada");
        }

        try {
            GoogleIdTokenVerifier verifier =
                    new GoogleIdTokenVerifier.Builder(
                            GoogleNetHttpTransport.newTrustedTransport(),
                            GsonFactory.getDefaultInstance()
                    )
                            .setAudience(
                                    Collections.singletonList(
                                            googleClientId
                                    )
                            )
                            .build();

            // =========================
            // DIAGNÓSTICO GOOGLE
            // Não imprime o JWT.
            // =========================

            GoogleIdToken debugToken =
                    GoogleIdToken.parse(
                            GsonFactory.getDefaultInstance(),
                            credential
                    );

            System.out.println(
                    "[GOOGLE LOGIN] ========================"
            );

            System.out.println(
                    "[GOOGLE LOGIN] CLIENT ID ESPERADO: "
                            + googleClientId
            );

            System.out.println(
                    "[GOOGLE LOGIN] AUD RECEBIDO: "
                            + debugToken.getPayload().getAudience()
            );

            System.out.println(
                    "[GOOGLE LOGIN] ISS RECEBIDO: "
                            + debugToken.getPayload().getIssuer()
            );

            System.out.println(
                    "[GOOGLE LOGIN] EXP RECEBIDO: "
                            + debugToken.getPayload().getExpirationTimeSeconds()
            );

            System.out.println(
                    "[GOOGLE LOGIN] EMAIL: "
                            + debugToken.getPayload().getEmail()
            );

            long nowMillis =
                    System.currentTimeMillis();

            long clockSkewSeconds =
                    verifier.getAcceptableTimeSkewSeconds();

            boolean audienceOk =
                    debugToken.verifyAudience(
                            Collections.singletonList(
                                    googleClientId
                            )
                    );

            boolean issuerOk =
                    debugToken.verifyIssuer(
                            java.util.Arrays.asList(
                                    "accounts.google.com",
                                    "https://accounts.google.com"
                            )
                    );

            boolean timeOk =
                    debugToken.verifyTime(
                            nowMillis,
                            clockSkewSeconds
                    );

            boolean expirationOk =
                    debugToken.verifyExpirationTime(
                            nowMillis,
                            clockSkewSeconds
                    );

            System.out.println(
                    "[GOOGLE LOGIN] IAT RECEBIDO: "
                            + debugToken.getPayload().getIssuedAtTimeSeconds()
            );

            System.out.println(
                    "[GOOGLE LOGIN] NBF RECEBIDO: "
                            + debugToken.getPayload().getNotBeforeTimeSeconds()
            );

            System.out.println(
                    "[GOOGLE LOGIN] AGORA EPOCH MS: "
                            + nowMillis
            );

            System.out.println(
                    "[GOOGLE LOGIN] AGORA ISO: "
                            + java.time.Instant.ofEpochMilli(nowMillis)
            );

            System.out.println(
                    "[GOOGLE LOGIN] CLOCK SKEW SEGUNDOS: "
                            + clockSkewSeconds
            );

            System.out.println(
                    "[GOOGLE LOGIN] AUDIENCE OK: "
                            + audienceOk
            );

            System.out.println(
                    "[GOOGLE LOGIN] ISSUER OK: "
                            + issuerOk
            );

            System.out.println(
                    "[GOOGLE LOGIN] TIME OK: "
                            + timeOk
            );

            System.out.println(
                    "[GOOGLE LOGIN] EXPIRATION OK: "
                            + expirationOk
            );

            System.out.println(
                    "[GOOGLE LOGIN] ========================"
            );

            GoogleIdToken idToken =
                    verifier.verify(
                            credential
                    );

            if (idToken == null) {
                System.out.println(
                        "[GOOGLE LOGIN] verifier.verify retornou NULL"
                );

                throw new RuntimeException(
                        "Login com Google inválido ou expirado"
                );
            }

            GoogleIdToken.Payload payload =
                    idToken.getPayload();

            String googleId =
                    payload.getSubject();

            String email =
                    payload.getEmail();

            Boolean emailVerified =
                    payload.getEmailVerified();

            String name =
                    valueAsString(
                            payload.get("name")
                    );

            String picture =
                    valueAsString(
                            payload.get("picture")
                    );

            if (googleId == null
                    || googleId.isBlank()
                    || email == null
                    || email.isBlank()
                    || !Boolean.TRUE.equals(emailVerified)) {

                throw new RuntimeException(
                        "A conta Google não possui um e-mail verificado"
                );
            }

            String normalizedEmail =
                    email.trim().toLowerCase();

            Customer customer =
                    customerRepository
                            .findByEmailIgnoreCase(
                                    normalizedEmail
                            )
                            .orElseGet(
                                    Customer::new
                            );

            if (customer.getId() != null
                    && !customer.isActive()) {

                throw new RuntimeException(
                        "Conta desativada"
                );
            }

            String existingGoogleId =
                    customer.getGoogleId();

            if (existingGoogleId != null
                    && !existingGoogleId.isBlank()
                    && !existingGoogleId.equals(googleId)) {

                throw new RuntimeException(
                        "Este e-mail já está vinculado a outra conta Google"
                );
            }

            if (customer.getId() == null) {
                customer.setEmail(
                        normalizedEmail
                );

                customer.setActive(
                        true
                );

                if (name != null
                        && !name.isBlank()) {

                    customer.setName(
                            name.trim()
                    );
                } else {
                    customer.setName(
                            normalizedEmail
                    );
                }
            }

            customer.setGoogleId(
                    googleId
            );

            customer.setEmailVerified(
                    true
            );

            if ((customer.getName() == null
                    || customer.getName().isBlank())
                    && name != null
                    && !name.isBlank()) {

                customer.setName(
                        name.trim()
                );
            }

            if (picture != null
                    && !picture.isBlank()) {

                customer.setProfileImageUrl(
                        picture.trim()
                );
            }

            customer.setLastLoginAt(
                    LocalDateTime.now()
            );

            Customer saved =
                    customerRepository.save(
                            customer
                    );

            System.out.println(
                    "[GOOGLE LOGIN] SUCESSO | customerId="
                            + saved.getId()
                            + " | email="
                            + saved.getEmail()
            );

            return saved;

        } catch (RuntimeException e) {
            throw e;

        } catch (Exception e) {
            System.out.println(
                    "[GOOGLE LOGIN] ERRO: "
                            + e.getClass().getName()
                            + " | "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Não foi possível validar o login com Google"
            );
        }
    }

    private String valueAsString(
            Object value
    ) {
        if (value == null) {
            return null;
        }

        String text =
                String.valueOf(
                        value
                );

        return text.isBlank()
                ? null
                : text;
    }

    public Customer findById(Long id) {
        return customerRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
    }

    public Customer findByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Cliente não encontrado");
        }

        return customerRepository
                .findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
    }

    // =========================
    // ATUALIZAR PERFIL
    // =========================

    public Customer updateProfile(
            Long customerId,
            String name,
            String email,
            String phone,
            String currentPassword,
            String newPassword
    ) {
        Customer customer = findById(customerId);

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Nome não informado");
        }

        if (email == null || email.isBlank()) {
            throw new RuntimeException("E-mail não informado");
        }

        String normalizedEmail = email.trim().toLowerCase();

        customerRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .filter(existing -> !existing.getId().equals(customerId))
                .ifPresent(existing -> {
                    throw new RuntimeException("Já existe uma conta com este e-mail");
                });

        customer.setName(name.trim());

        if (!normalizedEmail.equalsIgnoreCase(customer.getEmail())) {
            customer.setEmail(normalizedEmail);
            customer.setEmailVerified(false);
        }

        customer.setPhone(
                phone != null && !phone.isBlank()
                        ? phone.trim()
                        : null
        );

        boolean wantsNewPassword =
                newPassword != null && !newPassword.isBlank();

        if (wantsNewPassword) {
            if (newPassword.length() < 8) {
                throw new RuntimeException("A nova senha deve ter pelo menos 8 caracteres");
            }

            String currentHash = customer.getPasswordHash();

            if (currentHash != null && !currentHash.isBlank()) {
                if (currentPassword == null
                        || currentPassword.isBlank()
                        || !passwordEncoder.matches(currentPassword, currentHash)) {
                    throw new RuntimeException("Senha atual incorreta");
                }
            }

            customer.setPasswordHash(
                    passwordEncoder.encode(newPassword)
            );
        }

        return customerRepository.save(customer);
    }
}
