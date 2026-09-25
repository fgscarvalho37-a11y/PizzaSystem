package com.pizzasystem.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>>
    handleResponseStatusException(
            ResponseStatusException exception
    ) {

        HttpStatus status =
                HttpStatus.valueOf(
                        exception
                                .getStatusCode()
                                .value()
                );

        String message =
                exception.getReason() != null &&
                !exception.getReason().isBlank()
                        ? exception.getReason()
                        : status.getReasonPhrase();

        return ResponseEntity
                .status(
                        status
                )
                .body(
                        body(
                                status.value(),
                                message
                        )
                );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>>
    handleIllegalArgumentException(
            IllegalArgumentException exception
    ) {

        return ResponseEntity
                .badRequest()
                .body(
                        body(
                                HttpStatus.BAD_REQUEST.value(),
                                exception.getMessage() != null
                                        ? exception.getMessage()
                                        : "Dados inválidos."
                        )
                );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>>
    handleUnexpectedException(
            Exception exception
    ) {

        /*
         * Não expomos stack trace, SQL ou detalhes internos
         * para o cliente. O log do servidor continua sendo a
         * fonte para diagnóstico técnico.
         */
        return ResponseEntity
                .status(
                        HttpStatus.INTERNAL_SERVER_ERROR
                )
                .body(
                        body(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Erro interno do servidor."
                        )
                );
    }

    private Map<String, Object> body(
            int status,
            String message
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "status",
                status
        );

        response.put(
                "message",
                message
        );

        return response;
    }
}
