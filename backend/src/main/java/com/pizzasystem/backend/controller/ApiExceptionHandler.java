package com.pizzasystem.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger =
            LoggerFactory.getLogger(
                    ApiExceptionHandler.class
            );

    @ExceptionHandler(
            MethodArgumentNotValidException.class
    )
    public ResponseEntity<Map<String, String>> handleValidation(
            MethodArgumentNotValidException exception
    ) {

        String message =
                exception
                        .getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .findFirst()
                        .map(error ->
                                error.getDefaultMessage()
                        )
                        .orElse(
                                "Dados inválidos."
                        );

        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "message",
                                safeMessage(
                                        message,
                                        "Dados inválidos."
                                )
                        )
                );
    }

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    public ResponseEntity<Map<String, String>> handleBadRequest(
            IllegalArgumentException exception
    ) {

        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "message",
                                safeMessage(
                                        exception.getMessage(),
                                        "Dados inválidos."
                                )
                        )
                );
    }

    @ExceptionHandler(
            ResponseStatusException.class
    )
    public ResponseEntity<Map<String, String>> handleStatus(
            ResponseStatusException exception
    ) {

        int code =
                exception.getStatusCode()
                        .value();

        HttpStatus status =
                HttpStatus.resolve(
                        code
                );

        if (status == null) {
            status =
                    HttpStatus.BAD_REQUEST;
        }

        String fallback =
                status == HttpStatus.NOT_FOUND
                        ? "Recurso não encontrado."
                        : "Não foi possível concluir esta operação.";

        return ResponseEntity
                .status(
                        status
                )
                .body(
                        Map.of(
                                "message",
                                safeMessage(
                                        exception.getReason(),
                                        fallback
                                )
                        )
                );
    }

    @ExceptionHandler(
            SecurityException.class
    )
    public ResponseEntity<Map<String, String>> handleSecurity(
            SecurityException exception
    ) {

        return ResponseEntity
                .status(
                        HttpStatus.FORBIDDEN
                )
                .body(
                        Map.of(
                                "message",
                                "Operação não autorizada."
                        )
                );
    }

    @ExceptionHandler(
            IllegalStateException.class
    )
    public ResponseEntity<Map<String, String>> handleState(
            IllegalStateException exception
    ) {

        logger.warn(
                "Operação rejeitada pelo estado atual: {}",
                exception.getClass()
                        .getSimpleName()
        );

        return ResponseEntity
                .status(
                        HttpStatus.CONFLICT
                )
                .body(
                        Map.of(
                                "message",
                                "Não foi possível concluir esta operação."
                        )
                );
    }

    @ExceptionHandler(
            Exception.class
    )
    public ResponseEntity<Map<String, String>> handleUnexpected(
            Exception exception
    ) {

        logger.error(
                "Erro interno não tratado: {}",
                exception.getClass()
                        .getSimpleName()
        );

        return ResponseEntity
                .status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                )
                .body(
                        Map.of(
                                "message",
                                "Ocorreu um erro interno. Tente novamente."
                        )
                );
    }

    private String safeMessage(
            String message,
            String fallback
    ) {

        if (
                message == null ||
                message.isBlank()
        ) {
            return fallback;
        }

        String normalized =
                message.trim();

        if (
                normalized.length() > 220 ||
                normalized.contains("HTTP ") ||
                normalized.contains("sk_") ||
                normalized.contains("rk_") ||
                normalized.contains("whsec_") ||
                normalized.contains("Bearer ") ||
                normalized.contains("jdbc:") ||
                normalized.contains("Exception") ||
                normalized.contains(" at ")
        ) {
            return fallback;
        }

        return normalized;
    }
}
