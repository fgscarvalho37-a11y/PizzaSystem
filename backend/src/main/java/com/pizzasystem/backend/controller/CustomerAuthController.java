package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.CustomerLoginRequest;
import com.pizzasystem.backend.dto.CustomerRegisterRequest;

import com.pizzasystem.backend.entity.Customer;

import com.pizzasystem.backend.service.CustomerAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/customer-auth")
public class CustomerAuthController {

    private static final String SESSION_CUSTOMER_ID =
            "CUSTOMER_ID";

    private static final String SESSION_CUSTOMER_EMAIL =
            "CUSTOMER_EMAIL";

    private final CustomerAuthService customerAuthService;

    public CustomerAuthController(
            CustomerAuthService customerAuthService
    ) {

        this.customerAuthService =
                customerAuthService;
    }

    // =========================
    // CADASTRO
    // =========================

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody CustomerRegisterRequest request,
            HttpServletRequest servletRequest
    ) {

        try {

            Customer customer =
                    customerAuthService
                            .register(
                                    request
                            );

            /*
             * Cadastro já cria a sessão.
             *
             * NÃO invalidamos a sessão inteira
             * porque ela pode conter também
             * uma sessão administrativa.
             */
            HttpSession session =
                    servletRequest
                            .getSession(
                                    true
                            );

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.CREATED
                    )
                    .body(
                            authenticatedResponse(
                                    customer
                            )
                    );

        } catch (RuntimeException e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "authenticated",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(
                            HttpStatus.BAD_REQUEST
                    )
                    .body(
                            response
                    );
        }
    }

    // =========================
    // LOGIN
    // =========================

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody CustomerLoginRequest request,
            HttpServletRequest servletRequest
    ) {

        try {

            Customer customer =
                    customerAuthService
                            .login(
                                    request
                            );

            /*
             * Não invalidamos a HttpSession.
             *
             * Assim:
             *
             * ADMIN_USER_ID
             * CUSTOMER_ID
             *
             * podem existir ao mesmo tempo
             * no navegador durante desenvolvimento.
             */
            HttpSession session =
                    servletRequest
                            .getSession(
                                    true
                            );

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity.ok(
                    authenticatedResponse(
                            customer
                    )
            );

        } catch (RuntimeException e) {

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "authenticated",
                    false
            );

            /*
             * Não revelamos se foi
             * e-mail ou senha que falhou.
             */
            response.put(
                    "message",
                    "E-mail ou senha inválidos"
            );

            return ResponseEntity
                    .status(
                            HttpStatus.UNAUTHORIZED
                    )
                    .body(
                            response
                    );
        }
    }

    // =========================
    // LOGOUT
    // =========================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(
                        false
                );

        if (session != null) {

            /*
             * Remove SOMENTE a conta
             * do cliente.
             *
             * Não invalida sessão de admin.
             */
            session.removeAttribute(
                    SESSION_CUSTOMER_ID
            );

            session.removeAttribute(
                    SESSION_CUSTOMER_EMAIL
            );
        }

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                false
        );

        response.put(
                "message",
                "Logout realizado com sucesso"
        );

        return ResponseEntity.ok(
                response
        );
    }

    // =========================
    // SESSÃO ATUAL
    // =========================

    @GetMapping("/me")
    public ResponseEntity<?> me(
            HttpServletRequest request
    ) {

        HttpSession session =
                request.getSession(
                        false
                );

        if (session == null) {

            return unauthorized();
        }

        Object customerIdObject =
                session.getAttribute(
                        SESSION_CUSTOMER_ID
                );

        if (!(customerIdObject
                instanceof Long customerId)) {

            clearCustomerSession(
                    session
            );

            return unauthorized();
        }

        try {

            Customer customer =
                    customerAuthService
                            .findById(
                                    customerId
                            );

            if (!customer.isActive()) {

                clearCustomerSession(
                        session
                );

                return unauthorized();
            }

            /*
             * Mantém sessão sincronizada
             * com os dados atuais.
             */
            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity.ok(
                    authenticatedResponse(
                            customer
                    )
            );

        } catch (RuntimeException e) {

            clearCustomerSession(
                    session
            );

            return unauthorized();
        }
    }

    // =========================
    // RESPOSTA AUTENTICADA
    // =========================

    private Map<String, Object>
    authenticatedResponse(
            Customer customer
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                true
        );

        response.put(
                "id",
                customer.getId()
        );

        response.put(
                "name",
                customer.getName()
        );

        response.put(
                "email",
                customer.getEmail()
        );

        response.put(
                "phone",
                customer.getPhone()
        );

        response.put(
                "profileImageUrl",
                customer.getProfileImageUrl()
        );

        response.put(
                "emailVerified",
                customer.isEmailVerified()
        );

        response.put(
                "googleConnected",
                customer.getGoogleId() != null
                        && !customer
                        .getGoogleId()
                        .isBlank()
        );

        return response;
    }

    // =========================
    // LIMPAR SESSÃO CLIENTE
    // =========================

    private void clearCustomerSession(
            HttpSession session
    ) {

        session.removeAttribute(
                SESSION_CUSTOMER_ID
        );

        session.removeAttribute(
                SESSION_CUSTOMER_EMAIL
        );
    }

    // =========================
    // NÃO AUTENTICADO
    // =========================

    private ResponseEntity<?> unauthorized() {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "authenticated",
                false
        );

        return ResponseEntity
                .status(
                        HttpStatus.UNAUTHORIZED
                )
                .body(
                        response
                );
    }
}