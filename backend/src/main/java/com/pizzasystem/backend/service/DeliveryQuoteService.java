package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Store;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.nio.charset.StandardCharsets;

import java.time.Duration;

@Service
public class DeliveryQuoteService {

    private static final String ROUTES_URL =
            "https://routes.googleapis.com/directions/v2:computeRoutes";

    private final ObjectMapper objectMapper;

    private final HttpClient httpClient;

    private final String googleMapsApiKey;

    public DeliveryQuoteService(
            ObjectMapper objectMapper,
            @Value("${GOOGLE_MAPS_API_KEY:}")
            String googleMapsApiKey
    ) {

        this.objectMapper =
                objectMapper;

        this.googleMapsApiKey =
                googleMapsApiKey != null
                        ? googleMapsApiKey.trim()
                        : "";

        this.httpClient =
                HttpClient
                        .newBuilder()
                        .connectTimeout(
                                Duration.ofSeconds(
                                        8
                                )
                        )
                        .build();
    }

    public boolean isConfigured() {
        return !googleMapsApiKey.isBlank();
    }

    public DeliveryQuoteResponse quote(
            Store store,
            DeliveryArea area,
            DeliveryQuoteRequest request
    ) {

        if (store == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Loja não encontrada."
            );
        }

        if (area == null
                || !area.isActive()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Área de entrega indisponível."
            );
        }

        String pricingMode =
                area.getPricingMode() == null
                        ? "FIXED"
                        : area.getPricingMode()
                                .trim()
                                .toUpperCase();

        if ("FIXED".equals(
                pricingMode
        )) {

            BigDecimal fee =
                    normalizeMoney(
                            area.getFee()
                    );

            return new DeliveryQuoteResponse(
                    "FIXED",
                    null,
                    null,
                    fee,
                    area.getCity(),
                    area.getNeighborhood()
            );
        }

        if (!"PER_KM".equals(
                pricingMode
        )) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de entrega inválido."
            );
        }

        BigDecimal feePerKm =
                area.getFeePerKm();

        if (feePerKm == null
                || feePerKm.compareTo(
                        BigDecimal.ZERO
                ) < 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valor por km não configurado para esta área."
            );
        }

        String originAddress =
                clean(
                        store.getDeliveryOriginAddress()
                );

        if (originAddress.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O endereço de saída da pizzaria ainda não foi configurado."
            );
        }

        if (googleMapsApiKey.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O cálculo automático por distância ainda não está configurado."
            );
        }

        String destinationAddress =
                buildDestinationAddress(
                        request,
                        area
                );

        BigDecimal distanceKm =
                calculateDistanceKm(
                        originAddress,
                        destinationAddress
                );

        BigDecimal maxDistance =
                store.getDeliveryMaxDistanceKm();

        if (
                maxDistance != null &&
                maxDistance.compareTo(
                        BigDecimal.ZERO
                ) > 0 &&
                distanceKm.compareTo(
                        maxDistance
                ) > 0
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Endereço fora da distância máxima de entrega."
            );
        }

        BigDecimal fee =
                distanceKm
                        .multiply(
                                feePerKm
                        )
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        return new DeliveryQuoteResponse(
                "PER_KM",
                distanceKm,
                feePerKm.setScale(
                        2,
                        RoundingMode.HALF_UP
                ),
                fee,
                area.getCity(),
                area.getNeighborhood()
        );
    }

    private String buildDestinationAddress(
            DeliveryQuoteRequest request,
            DeliveryArea area
    ) {

        if (request == null) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Endereço de entrega não informado."
            );
        }

        String street =
                clean(
                        request.street()
                );

        String number =
                clean(
                        request.number()
                );

        if (street.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a rua para calcular a entrega."
            );
        }

        if (number.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o número para calcular a entrega."
            );
        }

        String city =
                clean(
                        area.getCity()
                );

        String neighborhood =
                clean(
                        area.getNeighborhood()
                );

        return String.join(
                ", ",
                street,
                number,
                neighborhood,
                city,
                "Brasil"
        );
    }

    private BigDecimal calculateDistanceKm(
            String originAddress,
            String destinationAddress
    ) {

        try {

            ObjectNode body =
                    objectMapper
                            .createObjectNode();

            body.put(
                    "travelMode",
                    "DRIVE"
            );

            body.put(
                    "routingPreference",
                    "TRAFFIC_UNAWARE"
            );

            body.set(
                    "origin",
                    objectMapper
                            .createObjectNode()
                            .put(
                                    "address",
                                    originAddress
                            )
            );

            body.set(
                    "destination",
                    objectMapper
                            .createObjectNode()
                            .put(
                                    "address",
                                    destinationAddress
                            )
            );

            HttpRequest request =
                    HttpRequest
                            .newBuilder()
                            .uri(
                                    URI.create(
                                            ROUTES_URL
                                    )
                            )
                            .timeout(
                                    Duration.ofSeconds(
                                            12
                                    )
                            )
                            .header(
                                    "Content-Type",
                                    "application/json; charset=utf-8"
                            )
                            .header(
                                    "X-Goog-Api-Key",
                                    googleMapsApiKey
                            )
                            .header(
                                    "X-Goog-FieldMask",
                                    "routes.distanceMeters"
                            )
                            .POST(
                                    HttpRequest
                                            .BodyPublishers
                                            .ofString(
                                                    objectMapper
                                                            .writeValueAsString(
                                                                    body
                                                            ),
                                                    StandardCharsets.UTF_8
                                            )
                            )
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse
                                    .BodyHandlers
                                    .ofString(
                                            StandardCharsets.UTF_8
                                    )
                    );

            if (
                    response.statusCode() < 200 ||
                    response.statusCode() >= 300
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Não foi possível consultar a distância da entrega."
                );
            }

            JsonNode root =
                    objectMapper.readTree(
                            response.body()
                    );

            JsonNode routes =
                    root.path(
                            "routes"
                    );

            if (
                    !routes.isArray() ||
                    routes.isEmpty()
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Não foi possível encontrar uma rota para este endereço."
                );
            }

            long distanceMeters =
                    routes
                            .get(
                                    0
                            )
                            .path(
                                    "distanceMeters"
                            )
                            .asLong(
                                    -1
                            );

            if (
                    distanceMeters <= 0
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Não foi possível calcular a distância deste endereço."
                );
            }

            return BigDecimal
                    .valueOf(
                            distanceMeters
                    )
                    .divide(
                            BigDecimal.valueOf(
                                    1000
                            ),
                            2,
                            RoundingMode.HALF_UP
                    );

        } catch (
                ResponseStatusException exception
        ) {

            throw exception;

        } catch (
                InterruptedException exception
        ) {

            Thread
                    .currentThread()
                    .interrupt();

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "A consulta de distância foi interrompida."
            );

        } catch (
                Exception exception
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível calcular a distância da entrega."
            );
        }
    }

    private BigDecimal normalizeMoney(
            BigDecimal value
    ) {

        if (value == null) {
            return BigDecimal.ZERO
                    .setScale(
                            2,
                            RoundingMode.HALF_UP
                    );
        }

        return value.setScale(
                2,
                RoundingMode.HALF_UP
        );
    }

    private String clean(
            String value
    ) {

        return value == null
                ? ""
                : value
                        .trim()
                        .replaceAll(
                                "\\s+",
                                " "
                        );
    }
}
