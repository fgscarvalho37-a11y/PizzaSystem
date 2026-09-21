package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.dto.CustomerLoginRequest;
import com.pizzasystem.backend.dto.CustomerRegisterRequest;
import com.pizzasystem.backend.entity.Customer;
import com.pizzasystem.backend.service.CustomerAuthService;
import com.pizzasystem.backend.service.EmailVerificationService;
import com.pizzasystem.backend.service.PasswordResetService;

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
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;

    public CustomerAuthController(
            CustomerAuthService customerAuthService,
            EmailVerificationService emailVerificationService,
            PasswordResetService passwordResetService
    ) {
        this.customerAuthService = customerAuthService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
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
                    customerAuthService.register(request);

            HttpSession session =
                    servletRequest.getSession(true);

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(authenticatedResponse(customer));

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
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
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
                    customerAuthService.login(request);

            HttpSession session =
                    servletRequest.getSession(true);

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity.ok(
                    authenticatedResponse(customer)
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
                    "E-mail ou senha inválidos"
            );

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }
    }

    // =========================
    // LOGIN COM GOOGLE
    // =========================

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(
            @RequestBody Map<String, Object> body,
            HttpServletRequest servletRequest
    ) {
        try {
            String credential =
                    stringValue(
                            body.get("credential")
                    );

            Customer customer =
                    customerAuthService
                            .loginWithGoogle(credential);

            HttpSession session =
                    servletRequest.getSession(true);

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity.ok(
                    authenticatedResponse(customer)
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
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }
    }

    // =========================
    // ENVIAR CÓDIGO
    // =========================

    @PostMapping("/email-verification/send")
    public ResponseEntity<?> sendVerificationCode(
            HttpServletRequest request
    ) {
        HttpSession session =
                request.getSession(false);

        if (session == null) {
            return unauthorized();
        }

        Long customerId =
                getCustomerId(session);

        if (customerId == null) {
            clearCustomerSession(session);
            return unauthorized();
        }

        try {
            Customer customer =
                    customerAuthService.findById(
                            customerId
                    );

            emailVerificationService.sendCode(
                    customerId
            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "message",
                    "Código de verificação enviado"
            );

            response.put(
                    "email",
                    maskEmail(customer.getEmail())
            );

            response.put(
                    "expiresInMinutes",
                    15
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // =========================
    // REENVIAR CÓDIGO
    // =========================

    @PostMapping("/email-verification/resend")
    public ResponseEntity<?> resendVerificationCode(
            HttpServletRequest request
    ) {
        HttpSession session =
                request.getSession(false);

        if (session == null) {
            return unauthorized();
        }

        Long customerId =
                getCustomerId(session);

        if (customerId == null) {
            clearCustomerSession(session);
            return unauthorized();
        }

        try {
            Customer customer =
                    customerAuthService.findById(
                            customerId
                    );

            emailVerificationService.resendCode(
                    customerId
            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "message",
                    "Novo código de verificação enviado"
            );

            response.put(
                    "email",
                    maskEmail(customer.getEmail())
            );

            response.put(
                    "expiresInMinutes",
                    15
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // =========================
    // VERIFICAR CÓDIGO
    // =========================

    @PostMapping("/email-verification/verify")
    public ResponseEntity<?> verifyEmail(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request
    ) {
        HttpSession session =
                request.getSession(false);

        if (session == null) {
            return unauthorized();
        }

        Long customerId =
                getCustomerId(session);

        if (customerId == null) {
            clearCustomerSession(session);
            return unauthorized();
        }

        try {
            String code =
                    stringValue(
                            body.get("code")
                    );

            Customer customer =
                    emailVerificationService.verify(
                            customerId,
                            code
                    );

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            Map<String, Object> response =
                    authenticatedResponse(customer);

            response.put(
                    "success",
                    true
            );

            response.put(
                    "message",
                    "E-mail verificado com sucesso"
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // =========================
    // SOLICITAR RECUPERAÇÃO DE SENHA
    // =========================

    @PostMapping("/password-reset/request")
    public ResponseEntity<?> requestPasswordReset(
            @RequestBody Map<String, Object> body
    ) {
        String email =
                stringValue(
                        body.get("email")
                );

        try {
            passwordResetService.requestReset(
                    email
            );

        } catch (RuntimeException ignored) {
            /*
             * A resposta continua neutra.
             *
             * Isso evita revelar se o e-mail existe
             * e também evita expor detalhes internos
             * de falhas no envio.
             */
        }

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                true
        );

        response.put(
                "message",
                "Se existir uma conta com esse e-mail, enviaremos um código de recuperação."
        );

        response.put(
                "expiresInMinutes",
                15
        );

        return ResponseEntity.ok(response);
    }

    // =========================
    // VALIDAR CÓDIGO DE RECUPERAÇÃO
    // =========================

    @PostMapping("/password-reset/validate")
    public ResponseEntity<?> validatePasswordResetCode(
            @RequestBody Map<String, Object> body
    ) {
        String email =
                stringValue(
                        body.get("email")
                );

        String code =
                stringValue(
                        body.get("code")
                );

        boolean valid =
                passwordResetService.validateCode(
                        email,
                        code
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "success",
                valid
        );

        if (valid) {
            response.put(
                    "message",
                    "Código válido"
            );

            return ResponseEntity.ok(response);
        }

        response.put(
                "message",
                "Código de recuperação inválido ou expirado."
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================
    // REDEFINIR SENHA
    // =========================

    @PostMapping("/password-reset/reset")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, Object> body
    ) {
        try {
            String email =
                    stringValue(
                            body.get("email")
                    );

            String code =
                    stringValue(
                            body.get("code")
                    );

            String newPassword =
                    stringValue(
                            body.get("newPassword")
                    );

            passwordResetService.resetPassword(
                    email,
                    code,
                    newPassword
            );

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "message",
                    "Senha redefinida com sucesso"
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "success",
                    false
            );

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
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
                request.getSession(false);

        if (session != null) {
            clearCustomerSession(session);
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

        return ResponseEntity.ok(response);
    }

    // =========================
    // SESSÃO ATUAL
    // =========================

    @GetMapping("/me")
    public ResponseEntity<?> me(
            HttpServletRequest request
    ) {
        HttpSession session =
                request.getSession(false);

        if (session == null) {
            return unauthorized();
        }

        Long customerId =
                getCustomerId(session);

        if (customerId == null) {
            clearCustomerSession(session);
            return unauthorized();
        }

        try {
            Customer customer =
                    customerAuthService.findById(
                            customerId
                    );

            if (!customer.isActive()) {
                clearCustomerSession(session);
                return unauthorized();
            }

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            return ResponseEntity.ok(
                    authenticatedResponse(customer)
            );

        } catch (RuntimeException e) {
            clearCustomerSession(session);
            return unauthorized();
        }
    }

    // =========================
    // ATUALIZAR MEUS DADOS
    // =========================

    @PatchMapping("/me")
    public ResponseEntity<?> updateMe(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request
    ) {
        HttpSession session =
                request.getSession(false);

        if (session == null) {
            return unauthorized();
        }

        Long customerId =
                getCustomerId(session);

        if (customerId == null) {
            clearCustomerSession(session);
            return unauthorized();
        }

        try {
            String name =
                    stringValue(body.get("name"));

            String email =
                    stringValue(body.get("email"));

            String phone =
                    stringValue(body.get("phone"));

            String currentPassword =
                    stringValue(
                            body.get("currentPassword")
                    );

            String newPassword =
                    stringValue(
                            body.get("newPassword")
                    );

            Customer customer =
                    customerAuthService.updateProfile(
                            customerId,
                            name,
                            email,
                            phone,
                            currentPassword,
                            newPassword
                    );

            session.setAttribute(
                    SESSION_CUSTOMER_ID,
                    customer.getId()
            );

            session.setAttribute(
                    SESSION_CUSTOMER_EMAIL,
                    customer.getEmail()
            );

            Map<String, Object> response =
                    authenticatedResponse(customer);

            response.put(
                    "message",
                    "Dados atualizados com sucesso"
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "message",
                    e.getMessage()
            );

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    // =========================
    // CUSTOMER ID DA SESSÃO
    // =========================

    private Long getCustomerId(
            HttpSession session
    ) {
        Object value =
                session.getAttribute(
                        SESSION_CUSTOMER_ID
                );

        if (value instanceof Long longValue) {
            return longValue;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        return null;
    }

    // =========================
    // MASCARAR EMAIL
    // =========================

    private String maskEmail(
            String email
    ) {
        if (email == null
                || email.isBlank()
                || !email.contains("@")) {
            return "";
        }

        String[] parts =
                email.split("@", 2);

        String local = parts[0];
        String domain = parts[1];

        if (local.length() <= 2) {
            return local.charAt(0)
                    + "***@"
                    + domain;
        }

        return local.substring(0, 2)
                + "***@"
                + domain;
    }

    private String stringValue(
            Object value
    ) {
        return value == null
                ? null
                : String.valueOf(value);
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
                        && !customer.getGoogleId().isBlank()
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
                .status(HttpStatus.UNAUTHORIZED)
                .body(response);
    }
}