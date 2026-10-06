package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;

/** Validate the location instead of accepting the geocoder's first result. */
record DeliveryAddress(String street, String number, String city, String region, String postalCode, String countryCode) {
    DeliveryAddress {
        street = street == null ? "" : street.trim();
        number = number == null ? "" : number.trim();
        city = city == null ? "" : city.trim();
        region = region == null ? "" : region.trim();
        postalCode = postalCode == null ? "" : postalCode.trim();
        countryCode = countryCode == null ? "" : countryCode.trim().toUpperCase(Locale.ROOT);
    }

    static DeliveryAddress fromOrigin(String text, String countryCode) {
        String[] parts = text == null ? new String[0] : text.split(",");
        String city = "", region = "", postalCode = "";

        for (String rawPart : parts) {
            String candidate = rawPart.trim().toUpperCase(Locale.ROOT);
            String digits = candidate.replaceAll("\\D", "");

            if ("BR".equalsIgnoreCase(countryCode) && digits.length() == 8) {
                postalCode = digits;
            } else if ("GB".equalsIgnoreCase(countryCode) &&
                    candidate.matches(".*[A-Z]{1,2}[0-9][A-Z0-9]?\\s*[0-9][A-Z]{2}.*")) {
                postalCode = candidate.replaceAll("[^A-Z0-9 ]", "").trim();
            }
        }

        for (int i = parts.length - 1; i >= 2; i--) {
            String part = parts[i].trim();
            if (part.matches("[0-9\\s-]+") || normalized(part).equals("brasil")) continue;
            if (part.matches("(?i)[A-Z]{2}")) {
                region = part.toUpperCase(Locale.ROOT);
                continue;
            }

            var match = Pattern.compile("^(.+?)\\s*[-/]\\s*([A-Za-z]{2})$").matcher(part);
            if (match.matches()) {
                city = match.group(1).trim();
                region = match.group(2).toUpperCase(Locale.ROOT);
            } else {
                city = part;
            }
            break;
        }

        String street = parts.length > 0 ? parts[0].trim() : "";
        String number = parts.length > 1 ? parts[1].trim().split("\\s+-\\s+", 2)[0] : "";
        if (normalized(number).equals("s n")) number = "";

        return new DeliveryAddress(street, number, city, region, postalCode, countryCode);
    }

    boolean matches(JsonNode properties) {
        String layer = properties.path("layer").asText();
        if (!layer.equals("address") && !layer.equals("street")) return false;

        String expectedCity = normalized(city);
        if (expectedCity.isBlank() || Arrays.stream(new String[]{"locality", "localadmin", "county"})
                .noneMatch(key -> expectedCity.equals(normalized(properties.path(key).asText())))) {
            return false;
        }

        String country = properties.path("country_a").asText();
        if (!country.isBlank() && !countryMatches(countryCode, country)) {
            return false;
        }

        String foundRegion = properties.path("region_a").asText().replaceFirst("(?i)^BR-", "");
        if (!region.isBlank() && !foundRegion.isBlank() && !region.equalsIgnoreCase(foundRegion)) {
            return false;
        }

        String foundPostalCode = digits(properties.path("postalcode").asText());
        String expectedPostalCode = digits(postalCode);
        if (!expectedPostalCode.isBlank() && !foundPostalCode.isBlank()
                && !expectedPostalCode.equals(foundPostalCode)) {
            return false;
        }

        String foundStreet = properties.path("street").asText();
        if (foundStreet.isBlank() && layer.equals("street")) {
            foundStreet = properties.path("name").asText();
        }
        if (!sameStreet(street, foundStreet)) return false;

        String foundNumber = properties.path("housenumber").asText();
        if (number.isBlank() || foundNumber.isBlank() || normalized(number).equals(normalized(foundNumber))) {
            return true;
        }

        return !expectedPostalCode.isBlank() && expectedPostalCode.equals(foundPostalCode);
    }

    private static boolean countryMatches(String expected, String found) {
        if (expected == null || expected.isBlank() || found == null || found.isBlank()) return true;

        String e = expected.toUpperCase(Locale.ROOT);
        String f = found.toUpperCase(Locale.ROOT);

        if (e.equals(f)) return true;
        if ("BR".equals(e)) return "BRA".equals(f);
        if ("US".equals(e)) return "USA".equals(f);
        if ("GB".equals(e)) return "GBR".equals(f);

        return false;
    }

    private static boolean sameStreet(String expected, String found) {
        String left = streetName(expected);
        String right = streetName(found);
        return !left.isBlank() && !right.isBlank() && left.equals(right);
    }

    private static String streetName(String text) {
        return normalized(text)
                .replaceFirst("^(rua|r|avenida|av|travessa|tv|alameda|al|estrada|est|rodovia|rod)\\s+", "")
                .replaceAll("\\b(de|da|do|das|dos)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String normalized(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ").trim();
    }
}
