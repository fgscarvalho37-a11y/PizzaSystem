package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzasystem.backend.dto.DeliveryQuoteRequest;
import com.pizzasystem.backend.dto.DeliveryQuoteResponse;
import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.entity.DeliveryDistanceTier;
import com.pizzasystem.backend.entity.Store;
import com.pizzasystem.backend.repository.DeliveryAreaRepository;
import com.pizzasystem.backend.repository.DeliveryDistanceTierRepository;
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
            "https://api.mapbox.com/search/geocode/v6/forward";

    private static final String DIRECTIONS_URL =
            "https://api.mapbox.com/directions/v5/mapbox/driving";

    private static final String PROVIDER =
            "MAPBOX";

    private final ObjectMapper objectMapper =
            new ObjectMapper();

    private final HttpClient httpClient;

    private final String mapboxAccessToken;

    private final DeliveryAreaRepository
            deliveryAreaRepository;

    private final DeliveryDistanceTierRepository
            deliveryDistanceTierRepository;

    public DeliveryQuoteService(
            @Value("${MAPBOX_ACCESS_TOKEN:}")
            String mapboxAccessToken,
            DeliveryAreaRepository deliveryAreaRepository,
            DeliveryDistanceTierRepository deliveryDistanceTierRepository
    ) {
        this.mapboxAccessToken =
                mapboxAccessToken != null
                        ? mapboxAccessToken.trim()
                        : "";

        this.deliveryAreaRepository =
                deliveryAreaRepository;

        this.deliveryDistanceTierRepository =
                deliveryDistanceTierRepository;

        this.httpClient =
                HttpClient
                        .newBuilder()
                        .connectTimeout(
                                Duration.ofSeconds(8)
                        )
                        .build();
    }

    public boolean isConfigured() {
        return !mapboxAccessToken.isBlank();
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

        if ("FIXED".equalsIgnoreCase(
                store.getDeliveryPricingMode()
        )) {
            return quoteByFixedArea(
                    store,
                    request
            );
        }

        if (mapboxAccessToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O cálculo por km está indisponível. Configure MAPBOX_ACCESS_TOKEN no backend."
            );
        }

        String originAddress =
                clean(
                        store.getDeliveryOriginAddress()
                );

        if (originAddress.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Configure o endereço de saída da pizzaria no painel de entregas."
            );
        }

        String pricingMode =
                clean(
                        store.getDeliveryPricingMode()
                ).toUpperCase(
                        java.util.Locale.ROOT
                );

        boolean tieredPricing =
                "DISTANCE_TIERED".equals(
                        pricingMode
                );

        BigDecimal feePerKm =
                store.getDeliveryFeePerKm();

        if (
                !tieredPricing &&
                (
                        feePerKm == null ||
                        feePerKm.compareTo(
                                BigDecimal.ZERO
                        ) < 0
                )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O valor por km ainda não foi configurado."
            );
        }

        String countryCode =
                normalizeCountryCode(
                        store.getCountryCode()
                );

        String destinationAddress =
                buildDestinationAddress(
                        request,
                        countryCode
                );

        Coordinates origin =
                validCoordinates(
                        store.getDeliveryOriginLatitude(),
                        store.getDeliveryOriginLongitude()
                )
                        ? new Coordinates(
                                store.getDeliveryOriginLongitude(),
                                store.getDeliveryOriginLatitude(),
                                originAddress
                        )
                        : geocode(
                                originAddress,
                                DeliveryAddress.fromOrigin(
                                        originAddress
                                ),
                                "saída da pizzaria",
                                countryCode
                        );

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
                        "entrega",
                        countryCode
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
                    "A rota calculada tem "
                            + distanceKm.toPlainString()
                            + " km; o limite da loja é "
                            + maxDistance.toPlainString()
                            + " km."
            );
        }

        BigDecimal normalizedFeePerKm =
                tieredPricing
                        ? null
                        : feePerKm.setScale(
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

        BigDecimal fee;

        if (freeDelivery) {
            fee =
                    BigDecimal.ZERO
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );

        } else if (tieredPricing) {
            fee =
                    resolveDistanceTierFee(
                            store.getId(),
                            distanceKm
                    );

        } else {
            fee =
                    billableDistanceKm
                            .multiply(
                                    normalizedFeePerKm
                            )
                            .setScale(
                                    2,
                                    RoundingMode.HALF_UP
                            );
        }

        return new DeliveryQuoteResponse(
                tieredPricing
                        ? "DISTANCE_TIERED"
                        : "PER_KM",
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
                null,
                origin.latitude(),
                origin.longitude(),
                destination.latitude(),
                destination.longitude()
        );
    }

    private BigDecimal resolveDistanceTierFee(
            Long storeId,
            BigDecimal distanceKm
    ) {
        for (
                DeliveryDistanceTier tier :
                deliveryDistanceTierRepository
                        .findByStoreIdAndActiveTrueOrderByMinDistanceKmAsc(
                                storeId
                        )
        ) {
            boolean aboveMinimum =
                    distanceKm.compareTo(
                            tier.getMinDistanceKm()
                    ) > 0;

            boolean withinMaximum =
                    distanceKm.compareTo(
                            tier.getMaxDistanceKm()
                    ) <= 0;

            if (
                    aboveMinimum &&
                    withinMaximum
            ) {
                return tier
                        .getFee()
                        .setScale(
                                2,
                                RoundingMode.HALF_UP
                        );
            }
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Não há uma faixa de entrega configurada para "
                        + distanceKm.toPlainString()
                        + " km."
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
                    "A área encontrada não possui taxa fixa ativa."
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
                null,
                null,
                null,
                null,
                null
        );
    }

    private String buildDestinationAddress(
            DeliveryQuoteRequest request,
            String countryCode
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
                );

        String postalCode =
                normalizePostalCode(
                        request.postalCode(),
                        countryCode
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

        if (city.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a cidade para calcular a entrega."
            );
        }

        if (
                "BR".equals(
                        countryCode
                ) &&
                state.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o estado para calcular a entrega."
            );
        }

        java.util.List<String> parts =
                new java.util.ArrayList<>();

        parts.add(
                street
        );
        parts.add(
                number
        );

        if (!neighborhood.isBlank()) {
            parts.add(
                    neighborhood
            );
        }

        parts.add(
                city
        );

        if (!state.isBlank()) {
            parts.add(
                    state
            );
        }

        if (!postalCode.isBlank()) {
            parts.add(
                    postalCode
            );
        }

        parts.add(
                countryCode
        );

        return String.join(
                ", ",
                parts
        );
    }

    private Coordinates geocode(
            String text,
            DeliveryAddress address,
            String role,
            String countryCode
    ) {
        if (
                address.street().isBlank() ||
                address.city().isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O endereço de "
                            + role
                            + " está incompleto. Informe rua, número e cidade."
            );
        }

        String normalizedCountryCode =
                normalizeCountryCode(
                        countryCode
                );

        StringBuilder url =
                new StringBuilder(
                        GEOCODE_URL
                );

        url.append(
                "?country="
        ).append(
                encode(
                        normalizedCountryCode
                )
        );
        url.append(
                "&autocomplete=false"
        );
        url.append(
                "&limit=5"
        );
        url.append(
                "&address_number="
        ).append(
                encode(
                        address.number()
                )
        );
        url.append(
                "&street="
        ).append(
                encode(
                        address.street()
                )
        );
        url.append(
                "&place="
        ).append(
                encode(
                        address.city()
                )
        );

        if (!address.region().isBlank()) {
            url.append(
                    "&region="
            ).append(
                    encode(
                            address.region()
                    )
            );
        }

        String postalCode =
                normalizePostalCode(
                        address.postalCode(),
                        normalizedCountryCode
                );

        if (!postalCode.isBlank()) {
            url.append(
                    "&postcode="
            ).append(
                    encode(
                            postalCode
                    )
            );
        }

        url.append(
                "&access_token="
        ).append(
                encode(
                        mapboxAccessToken
                )
        );

        Coordinates result =
                fetchCoordinates(
                        url.toString(),
                        text
                );

        if (result == null) {
            String fallbackUrl =
                    GEOCODE_URL
                            + "?q="
                            + encode(
                                    text
                            )
                            + "&country="
                            + encode(
                                    normalizedCountryCode
                            )
                            + "&limit=5"
                            + "&autocomplete=false"
                            + "&access_token="
                            + encode(
                                    mapboxAccessToken
                            );

            result =
                    fetchCoordinates(
                            fallbackUrl,
                            text
                    );
        }

        if (result == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não foi possível localizar o endereço de "
                            + role
                            + " no Mapbox. Confira rua, número, cidade, região e código postal."
            );
        }

        return result;
    }

    private Coordinates fetchCoordinates(
            String url,
            String fallbackLabel
    ) {
        try {
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
                            .GET()
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString(
                                    StandardCharsets.UTF_8
                            )
                    );

            if (response.statusCode() == 429) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "O Mapbox atingiu o limite de consultas. Tente novamente em instantes."
                );
            }

            if (
                    response.statusCode() < 200 ||
                    response.statusCode() >= 300
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "O Mapbox não conseguiu localizar o endereço agora."
                );
            }

            JsonNode features =
                    objectMapper
                            .readTree(
                                    response.body()
                            )
                            .path(
                                    "features"
                            );

            if (!features.isArray()) {
                return null;
            }

            for (JsonNode feature : features) {
                JsonNode point =
                        feature
                                .path(
                                        "geometry"
                                )
                                .path(
                                        "coordinates"
                                );

                if (
                        !point.isArray() ||
                        point.size() < 2 ||
                        !point.get(0).isNumber() ||
                        !point.get(1).isNumber()
                ) {
                    continue;
                }

                double longitude =
                        point
                                .get(0)
                                .asDouble();

                double latitude =
                        point
                                .get(1)
                                .asDouble();

                if (!validCoordinates(
                        latitude,
                        longitude
                )) {
                    continue;
                }

                JsonNode properties =
                        feature.path(
                                "properties"
                        );

                String label =
                        firstNonBlank(
                                properties
                                        .path(
                                                "full_address"
                                        )
                                        .asText(),
                                properties
                                        .path(
                                                "name"
                                        )
                                        .asText(),
                                fallbackLabel
                        );

                return new Coordinates(
                        longitude,
                        latitude,
                        label
                );
            }

            return null;

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
                    "A consulta de endereço foi interrompida."
            );

        } catch (
                Exception exception
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Não foi possível consultar o Mapbox."
            );
        }
    }

    private BigDecimal calculateDistanceKm(
            Coordinates origin,
            Coordinates destination
    ) {
        try {
            String coordinates =
                    origin.longitude()
                            + ","
                            + origin.latitude()
                            + ";"
                            + destination.longitude()
                            + ","
                            + destination.latitude();

            String url =
                    DIRECTIONS_URL
                            + "/"
                            + coordinates
                            + "?overview=false"
                            + "&access_token="
                            + encode(
                                    mapboxAccessToken
                            );

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
                                            15
                                    )
                            )
                            .header(
                                    "Accept",
                                    "application/json"
                            )
                            .GET()
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString(
                                    StandardCharsets.UTF_8
                            )
                    );

            if (response.statusCode() == 429) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "O Mapbox atingiu o limite de rotas. Tente novamente em instantes."
                );
            }

            if (
                    response.statusCode() < 200 ||
                    response.statusCode() >= 300
            ) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Não foi possível consultar a rota no Mapbox."
                );
            }

            JsonNode root =
                    objectMapper
                            .readTree(
                                    response.body()
                            );

            if (!"Ok".equalsIgnoreCase(
                    root.path(
                            "code"
                    ).asText()
            )) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O Mapbox não encontrou uma rota de carro para este endereço."
                );
            }

            double distanceMeters =
                    root
                            .path(
                                    "routes"
                            )
                            .path(
                                    0
                            )
                            .path(
                                    "distance"
                            )
                            .asDouble(
                                    -1
                            );

            if (distanceMeters <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O Mapbox não retornou uma distância válida."
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

    private String normalizeCountryCode(
            String value
    ) {
        String normalized =
                clean(
                        value
                ).toUpperCase(
                        java.util.Locale.ROOT
                );

        return normalized.matches(
                "^[A-Z]{2}$"
        )
                ? normalized
                : "BR";
    }

    private String normalizePostalCode(
            String value,
            String countryCode
    ) {
        String normalized =
                clean(
                        value
                );

        if (
                "BR".equals(
                        normalizeCountryCode(
                                countryCode
                        )
                )
        ) {
            return normalized.replaceAll(
                    "\\D",
                    ""
            );
        }

        return normalized
                .toUpperCase(
                        java.util.Locale.ROOT
                )
                .replaceAll(
                        "[^A-Z0-9 -]",
                        ""
                );
    }

    private boolean validCoordinates(
            Double latitude,
            Double longitude
    ) {
        return latitude != null &&
                longitude != null &&
                Double.isFinite(
                        latitude
                ) &&
                Double.isFinite(
                        longitude
                ) &&
                latitude >= -90 &&
                latitude <= 90 &&
                longitude >= -180 &&
                longitude <= 180;
    }

    private String firstNonBlank(
            String... values
    ) {
        for (String value : values) {
            if (
                    value != null &&
                    !value.isBlank()
            ) {
                return value.trim();
            }
        }

        return "";
    }

    private String encode(
            String value
    ) {
        return URLEncoder.encode(
                value == null
                        ? ""
                        : value,
                StandardCharsets.UTF_8
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

    private record Coordinates(
            double longitude,
            double latitude,
            String label
    ) {
    }
}
