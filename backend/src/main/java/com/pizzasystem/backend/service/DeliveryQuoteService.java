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


        // A escolha da loja é a única fonte de verdade para a cobrança.
        // Áreas antigas não podem substituir uma cotação por distância.
        if ("FIXED".equals(store.getDeliveryPricingMode())) {
            return quoteByFixedArea(store, request);
        }

        if (openRouteServiceApiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O cálculo por km está indisponível. Configure a chave do OpenRouteService ou selecione taxa fixa no painel."
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
                geocode(originAddress, DeliveryAddress.fromOrigin(originAddress), "saída da pizzaria");

        Coordinates destination =
                geocode(
                        destinationAddress,
                        new DeliveryAddress(
                                request.street(),
                                request.number(),
                                request.city(),
                                request.state(),
                                request.postalCode()
                        ),
                        "entrega"
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
                    "A rota calculada tem " + distanceKm.toPlainString() + " km; o limite da loja é "
                            + maxDistance.toPlainString() + " km. Pontos encontrados: "
                            + origin.label() + " → " + destination.label() + "."
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
                                                "Não há taxa fixa ativa cadastrada para este bairro e cidade."
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

        return quoteFromFixedArea(
                store,
                request,
                area
        );
    }

    private DeliveryQuoteResponse quoteFromFixedArea(
            Store store,
            DeliveryQuoteRequest request,
            DeliveryArea area
    ) {

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

        BigDecimal fixedFee =
                area.getFee() != null
                        ? area.getFee()
                        : BigDecimal.ZERO;

        BigDecimal fee =
                freeDelivery
                        ? BigDecimal.ZERO
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                        : fixedFee.setScale(
                                2,
                                RoundingMode.HALF_UP
                        );

        return new DeliveryQuoteResponse(
                "FIXED",
                null,
                null,
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

        String state =
                clean(
                        request.state()
                ).toUpperCase(java.util.Locale.ROOT);

        String postalCode =
                clean(
                        request.postalCode()
                ).replaceAll("\\D", "");

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

        String cityRegion =
                state.isBlank()
                        ? city
                        : city + " - " + state;

        String destination =
                String.join(
                        ", ",
                        street,
                        number,
                        neighborhood,
                        cityRegion
                );

        if (!postalCode.isBlank()) {
            destination += ", " + postalCode;
        }

        return destination + ", Brasil";
    }

    private Coordinates geocode(String text, DeliveryAddress address, String role) {
        if (address.city().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Informe a cidade no endereço de " + role + ". Use: rua, número, cidade - UF.");
        }
        // Keep city and street separate: free-text searches can match a similarly
        // named road elsewhere in Brazil, even when the requested city is present.
        String structured = GEOCODE_URL + "/structured?address="
                + encode(address.street() + " " + address.number())
                + "&locality=" + encode(address.city()) + "&country=BR"
                + (address.region().isBlank() ? "" : "&region=" + encode(address.region()))
                + (address.postalCode().isBlank() ? "" : "&postalcode=" + encode(address.postalCode()));
        Coordinates result = searchCoordinates(structured, address);
        if (result == null) {
            result = searchCoordinates(GEOCODE_URL + "?text=" + encode(text), address);
        }
        if (result == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não foi possível confirmar a rua na cidade informada para " + role
                            + ". Confira o nome completo da rua e a cidade; nenhum ponto aproximado de outra cidade foi usado.");
        }
        return result;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private Coordinates searchCoordinates(String url, DeliveryAddress address) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url + "&size=10&boundary.country=BR"))
                    .timeout(Duration.ofSeconds(12))
                    .header("Accept", "application/json")
                    .header("Authorization", openRouteServiceApiKey).GET().build();
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 429) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "O serviço de mapas atingiu o limite de consultas. Aguarde um pouco e tente recalcular.");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "O serviço de localização está indisponível. Tente recalcular em instantes.");
            }
            JsonNode features = objectMapper.readTree(response.body()).path("features");
            if (!features.isArray()) return null;
            for (JsonNode feature : features) {
                JsonNode properties = feature.path("properties");
                if (!address.matches(properties)) continue;
                JsonNode point = feature.path("geometry").path("coordinates");
                if (!point.isArray() || point.size() < 2
                        || !point.get(0).isNumber() || !point.get(1).isNumber()) continue;
                double longitude = point.get(0).asDouble();
                double latitude = point.get(1).asDouble();
                if (!Double.isFinite(longitude) || !Double.isFinite(latitude)
                        || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) continue;
                return new Coordinates(longitude, latitude, properties.path("label").asText(address.city()));
            }
            return null;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "A consulta do endereço foi interrompida.");
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Não foi possível consultar o serviço de localização. Tente recalcular.");
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

            body.put("units", "m");

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
            double latitude,
            String label
    ) {
    }
}
