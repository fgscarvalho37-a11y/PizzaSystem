package com.pizzasystem.backend.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class CsrfController {

    // =========================
    // TOKEN CSRF
    // =========================

    @GetMapping("/csrf")
    public Map<String, String> csrf(
            CsrfToken csrfToken
    ) {

        Map<String, String> response =
                new HashMap<>();

        response.put(
                "token",
                csrfToken.getToken()
        );

        response.put(
                "headerName",
                csrfToken.getHeaderName()
        );

        response.put(
                "parameterName",
                csrfToken.getParameterName()
        );

        return response;
    }
}