package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;

/** Validate the location instead of accepting the geocoder's first result. */
record DeliveryAddress(String street, String number, String city, String region) {
    DeliveryAddress {
        street = street == null ? "" : street.trim();
        number = number == null ? "" : number.trim();
        city = city == null ? "" : city.trim();
        region = region == null ? "" : region.trim();
    }
    static DeliveryAddress fromOrigin(String text) {
        String[] parts = text.split(",");
        String city = "", region = "";
        for (int i = parts.length - 1; i >= 2; i--) {
            String part = parts[i].trim();
            if (part.matches("[0-9\\s-]+") || normalized(part).equals("brasil")) continue;
            if (part.matches("(?i)[A-Z]{2}")) { region = part.toUpperCase(Locale.ROOT); continue; }
            var match = Pattern.compile("^(.+?)\\s*[-/]\\s*([A-Za-z]{2})$").matcher(part);
            if (match.matches()) { city = match.group(1).trim(); region = match.group(2).toUpperCase(Locale.ROOT); }
            else city = part;
            break;
        }
        String number = parts.length > 1 ? parts[1].trim().split("\\s+-\\s+", 2)[0] : "";
        if (normalized(number).equals("s n")) number = "";
        return new DeliveryAddress(parts[0], number, city, region);
    }
    boolean matches(JsonNode properties) {
        String layer = properties.path("layer").asText();
        if (!layer.equals("address") && !layer.equals("street")) return false;
        String expectedCity = normalized(city);
        if (expectedCity.isBlank() || Arrays.stream(new String[]{"locality", "localadmin"})
                .noneMatch(key -> expectedCity.equals(normalized(properties.path(key).asText())))) return false;
        String country = properties.path("country_a").asText();
        if (!country.isBlank() && !country.equalsIgnoreCase("BRA") && !country.equalsIgnoreCase("BR")) return false;
        String foundRegion = properties.path("region_a").asText().replaceFirst("(?i)^BR-", "");
        if (!region.isBlank() && !foundRegion.isBlank() && !region.equalsIgnoreCase(foundRegion)) return false;
        String foundStreet = properties.path("street").asText();
        if (foundStreet.isBlank() && layer.equals("street")) foundStreet = properties.path("name").asText();
        if (streetName(street).isBlank() || !streetName(street).equals(streetName(foundStreet))) return false;
        String foundNumber = properties.path("housenumber").asText();
        return number.isBlank() || foundNumber.isBlank() || normalized(number).equals(normalized(foundNumber));
    }
    private static String streetName(String text) {
        return normalized(text).replaceFirst("^(rua|r|avenida|av|travessa|tv|alameda|al|estrada|est|rodovia|rod)\\s+", "");
    }
    private static String normalized(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ").trim();
    }
}
