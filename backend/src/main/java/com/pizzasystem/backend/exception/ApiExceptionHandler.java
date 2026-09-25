package com.pizzasystem.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(
            ResponseStatusException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleResponseStatus(
            ResponseStatusException exception
    ) {

        HttpStatus status =
                HttpStatus.valueOf(
                        exception.getStatusCode().value()
                );

        String message =
                exception.getReason() != null &&
                !exception.getReason().isBlank()
                        ? exception.getReason()
                        : status.getReasonPhrase();

        return build(
                status,
                message
        );
    }

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleIllegalArgument(
            IllegalArgumentException exception
    ) {

        String message =
                exception.getMessage() != null &&
                !exception.getMessage().isBlank()
                        ? exception.getMessage()
                        : "Dados inválidos.";

        return build(
                HttpStatus.BAD_REQUEST,
                message
        );
    }

    @ExceptionHandler(
            IllegalStateException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleIllegalState(
            IllegalStateException exception
    ) {

        String message =
                exception.getMessage() != null &&
                !exception.getMessage().isBlank()
                        ? exception.getMessage()
                        : "Não foi possível concluir a operação.";

        return build(
                HttpStatus.CONFLICT,
                message
        );
    }

    private ResponseEntity<Map<String, Object>>
    build(
            HttpStatus status,
            String message
    ) {

        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put(
                "timestamp",
                LocalDateTime.now()
        );

        body.put(
                "status",
                status.value()
        );

        body.put(
                "error",
                status.getReasonPhrase()
        );

        body.put(
                "message",
                message
        );

        return ResponseEntity
                .status(
                        status
                )
                .body(
                        body
                );
    }
}
