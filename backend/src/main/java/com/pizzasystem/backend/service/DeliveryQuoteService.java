package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.Store;

import com.pizzasystem.backend.repository.DeliveryAreaRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.nio.charset.StandardCharsets;

import java.time.Duration;

@Service
public class DeliveryQuoteService {

    private static final String GEOCODE_URL =
            "https://api.heigit.org/pelias/v1/search";

    private static final String DIRECTIONS_URL =
            "https://api.heigit.org/openrouteservice/v2/directions/driving-car";

    private static final String PROVIDER =
            "OPENROUTESERVICE";

    private final ObjectMapper objectMapper =
            new ObjectMapper();

    private final HttpClient httpClient;

    private final String openRouteServiceApiKey;

    private final DeliveryAreaRepository
            deliveryAreaRepository;

    public DeliveryQuoteService(
            @Value("${OPENROUTESERVICE_API_KEY:}")
            String openRouteServiceApiKey,
            DeliveryAreaRepository deliveryAreaRepository
    ) {

        this.openRouteServiceApiKey =
                openRouteServiceApiKey != null
                        ? openRouteServiceApiKey.trim()
                        : "";

        this.deliveryAreaRepository =
                deliveryAreaRepository;

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
        return !openRouteServiceApiKey
                .isBlank();
    }

    public String getProviderName() {
        return PROVIDER;
    }

    public DeliveryQuoteResponse quote(
            Store store,
            DeliveryQuoteRequest request
    ) {

        if (store == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Loja não encontrada."
            );
        }

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Endereço de entrega não informado."
            );
        }

        if (openRouteServiceApiKey.isBlank()) {

            return quoteByFixedArea(
                    store,
                    request
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

        BigDecimal feePerKm =
                store.getDeliveryFeePerKm();

        if (
                feePerKm == null ||
                feePerKm.compareTo(
                        BigDecimal.ZERO
                ) < 0
        ) {

            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O valor por km ainda não foi configurado."
            );
        }

        String destinationAddress =
                buildDestinationAddress(
                        request
                );

        Coordinates origin =
                geocode(
                        originAddress
                );

        Coordinates destination =
                geocode(
                        destinationAddress
                );

        BigDecimal distanceKm =
                calculateDistanceKm(
                        origin,
                        destination
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

        BigDecimal normalizedFeePerKm =
                feePerKm.setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        BigDecimal subtotal =
                request.orderSubtotal() != null
                        ? request.orderSubtotal()
                                .max(
                                        BigDecimal.ZERO
                                )
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : BigDecimal.ZERO
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                );

        BigDecimal freeDeliveryAbove =
                store.getDeliveryFreeAbove();

        BigDecimal freeDeliveryDistanceKm =
                store.getDeliveryFreeDistanceKm();

        boolean freeByOrderValue =
                freeDeliveryAbove != null &&
                freeDeliveryAbove.compareTo(
                        BigDecimal.ZERO
                ) > 0 &&
                subtotal.compareTo(
                        freeDeliveryAbove
                ) >= 0;

        boolean freeByDistance =
                freeDeliveryDistanceKm != null &&
                freeDeliveryDistanceKm.compareTo(
                        BigDecimal.ZERO
                ) > 0 &&
                distanceKm.compareTo(
                        freeDeliveryDistanceKm
                ) <= 0;

        boolean freeDelivery =
                freeByOrderValue ||
                freeByDistance;

        BigDecimal billableDistanceKm =
                distanceKm;

        if (
                freeDeliveryDistanceKm != null &&
                freeDeliveryDistanceKm.compareTo(
                        BigDecimal.ZERO
                ) > 0 &&
                distanceKm.compareTo(
                        freeDeliveryDistanceKm
                ) > 0
        ) {

            billableDistanceKm =
                    distanceKm
                            .subtract(
                                    freeDeliveryDistanceKm
                            )
                            .max(
                                    BigDecimal.ZERO
                            );
        }

        BigDecimal fee =
                freeDelivery
                        ? BigDecimal.ZERO
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : billableDistanceKm
                                .multiply(
                                        normalizedFeePerKm
                                )
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                );

        return new DeliveryQuoteResponse(
                "PER_KM",
                distanceKm,
                normalizedFeePerKm,
                fee,
                clean(
                        request.city()
                ),
                clean(
                        request.neighborhood()
                ),
                freeDelivery,
                freeDeliveryAbove != null
                        ? freeDeliveryAbove
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : null,
                freeDeliveryDistanceKm != null
                        ? freeDeliveryDistanceKm
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : null,
                PROVIDER,
                buildGoogleMapsUrl(
                        originAddress,
                        destinationAddress
                )
        );
    }

    private DeliveryQuoteResponse quoteByFixedArea(
            Store store,
            DeliveryQuoteRequest request
    ) {

        String city =
                clean(
                        request.city()
                );

        String neighborhood =
                clean(
                        request.neighborhood()
                );

        if (city.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a cidade para calcular a entrega."
            );
        }

        if (neighborhood.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o bairro para calcular a entrega."
            );
        }

        DeliveryArea area =
                deliveryAreaRepository
                        .findByStoreIdAndCityIgnoreCaseAndNeighborhoodIgnoreCaseAndActiveTrue(
                                store.getId(),
                                city,
                                neighborhood
                        )
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.SERVICE_UNAVAILABLE,
                                                "O cálculo por rota está indisponível e não existe uma taxa fixa cadastrada para este bairro."
                                        )
                        );

        if (!"FIXED".equalsIgnoreCase(
                area.getPricingMode()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O cálculo por rota está indisponível no momento."
            );
        }

        BigDecimal subtotal =
                request.orderSubtotal() != null
                        ? request.orderSubtotal()
                                .max(
                                        BigDecimal.ZERO
                                )
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : BigDecimal.ZERO
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                );

        BigDecimal freeDeliveryAbove =
                store.getDeliveryFreeAbove();

        boolean freeDelivery =
                freeDeliveryAbove != null &&
                freeDeliveryAbove.compareTo(
                        BigDecimal.ZERO
                ) > 0 &&
                subtotal.compareTo(
                        freeDeliveryAbove
                ) >= 0;

        BigDecimal fee =
                freeDelivery
                        ? BigDecimal.ZERO
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : area.getFee()
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                );

        return new DeliveryQuoteResponse(
                "FIXED",
                null,
                null,
                fee,
                city,
                neighborhood,
                freeDelivery,
                freeDeliveryAbove != null
                        ? freeDeliveryAbove
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : null,
                null,
                "FIXED_AREA",
                null
        );
    }

    private String buildDestinationAddress(
            DeliveryQuoteRequest request
    ) {

        String street =
                clean(
                        request.street()
                );

        String number =
                clean(
                        request.number()
                );

        String neighborhood =
                clean(
                        request.neighborhood()
                );

        String city =
                clean(
                        request.city()
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

        if (neighborhood.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o bairro para calcular a entrega."
            );
        }

        if (city.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a cidade para calcular a entrega."
            );
        }

        return String.join(
                ", ",
                street,
                number,
                neighborhood,
                city,
                "Brasil"
        );
    }

    private Coordinates geocode(
            String address
    ) {

        try {

            String url =
                    GEOCODE_URL
                            + "?text="
                            + URLEncoder.encode(
                                    address,
                                    StandardCharsets.UTF_8
                            )
                            + "&size=1"
                            + "&boundary.country=BR";

            HttpRequest request =
                    HttpRequest
                            .newBuilder()
                            .uri(
                                    URI.create(
                                            url
                                    )
                            )
                            .timeout(
                                    Duration.ofSeconds(
                                            12
                                    )
                            )
                            .header(
                                    "Accept",
                                    "application/json"
                            )
                            .header(
                                    "Authorization",
                                    openRouteServiceApiKey
                            )
                            .GET()
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
                        "Não foi possível localizar o endereço informado."
                );
            }

            JsonNode root =
                    objectMapper.readTree(
                            response.body()
                    );

            JsonNode features =
                    root.path(
                            "features"
                    );

            if (
                    !features.isArray() ||
                    features.isEmpty()
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Endereço não encontrado. Revise rua, número, bairro e cidade."
                );
            }

            JsonNode coordinates =
                    features
                            .get(
                                    0
                            )
                            .path(
                                    "geometry"
                            )
                            .path(
                                    "coordinates"
                            );

            if (
                    !coordinates.isArray() ||
                    coordinates.size() < 2
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "O provedor de mapas não retornou coordenadas válidas."
                );
            }

            double longitude =
                    coordinates
                            .get(
                                    0
                            )
                            .asDouble();

            double latitude =
                    coordinates
                            .get(
                                    1
                            )
                            .asDouble();

            return new Coordinates(
                    longitude,
                    latitude
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
                    "A consulta do endereço foi interrompida."
            );

        } catch (
                Exception exception
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível localizar o endereço informado."
            );
        }
    }

    private BigDecimal calculateDistanceKm(
            Coordinates origin,
            Coordinates destination
    ) {

        try {

            ObjectNode body =
                    objectMapper
                            .createObjectNode();

            ArrayNode coordinates =
                    objectMapper
                            .createArrayNode();

            ArrayNode originNode =
                    objectMapper
                            .createArrayNode();

            originNode.add(
                    origin.longitude()
            );

            originNode.add(
                    origin.latitude()
            );

            ArrayNode destinationNode =
                    objectMapper
                            .createArrayNode();

            destinationNode.add(
                    destination.longitude()
            );

            destinationNode.add(
                    destination.latitude()
            );

            coordinates.add(
                    originNode
            );

            coordinates.add(
                    destinationNode
            );

            body.set(
                    "coordinates",
                    coordinates
            );

            HttpRequest request =
                    HttpRequest
                            .newBuilder()
                            .uri(
                                    URI.create(
                                            DIRECTIONS_URL
                                    )
                            )
                            .timeout(
                                    Duration.ofSeconds(
                                            15
                                    )
                            )
                            .header(
                                    "Content-Type",
                                    "application/json; charset=utf-8"
                            )
                            .header(
                                    "Accept",
                                    "application/json"
                            )
                            .header(
                                    "Authorization",
                                    openRouteServiceApiKey
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
                        "Não foi possível consultar a rota da entrega."
                );
            }

            JsonNode root =
                    objectMapper.readTree(
                            response.body()
                    );

            double distanceMeters =
                    root
                            .path(
                                    "routes"
                            )
                            .path(
                                    0
                            )
                            .path(
                                    "summary"
                            )
                            .path(
                                    "distance"
                            )
                            .asDouble(
                                    -1
                            );

            if (
                    distanceMeters <= 0
            ) {

                distanceMeters =
                        root
                                .path(
                                        "features"
                                )
                                .path(
                                        0
                                )
                                .path(
                                        "properties"
                                )
                                .path(
                                        "summary"
                                )
                                .path(
                                        "distance"
                                )
                                .asDouble(
                                        -1
                                );
            }

            if (
                    distanceMeters <= 0
            ) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Não foi possível encontrar uma rota para este endereço."
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
                    "A consulta de rota foi interrompida."
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

    private String buildGoogleMapsUrl(
            String origin,
            String destination
    ) {

        return "https://www.google.com/maps/dir/?api=1"
                + "&origin="
                + URLEncoder.encode(
                        origin,
                        StandardCharsets.UTF_8
                )
                + "&destination="
                + URLEncoder.encode(
                        destination,
                        StandardCharsets.UTF_8
                )
                + "&travelmode=driving";
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

    private record Coordinates(
            double longitude,
            double latitude
    ) {
    }
}
