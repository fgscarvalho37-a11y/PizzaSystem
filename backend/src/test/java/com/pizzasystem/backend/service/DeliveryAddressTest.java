package com.pizzasystem.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DeliveryAddressTest {
    private final DeliveryAddress address =
            new DeliveryAddress("Av. das Flores", "100", "São Bento", "SP", "12345-000");

    private ObjectNode candidate() {
        return new ObjectMapper().createObjectNode()
                .put("layer", "address")
                .put("street", "Avenida das Flores")
                .put("housenumber", "100")
                .put("locality", "Sao Bento")
                .put("region_a", "SP")
                .put("postalcode", "12345-000")
                .put("country_a", "BRA");
    }

    @Test
    void acceptsAccentsAndStreetAbbreviations() {
        assertTrue(address.matches(candidate()));
    }

    @Test
    void rejectsSameStreetInAnotherCity() {
        assertFalse(address.matches(candidate().put("locality", "Outra Cidade")));
    }

    @Test
    void rejectsCityCentroid() {
        assertFalse(address.matches(candidate().put("layer", "locality")));
    }

    @Test
    void rejectsDifferentStreet() {
        assertFalse(address.matches(candidate().put("street", "Rua das Pedras")));
    }

    @Test
    void acceptsApproximateHouseNumberWhenPostalCodeMatches() {
        assertTrue(address.matches(candidate().put("housenumber", "102")));
    }

    @Test
    void rejectsDifferentPostalCode() {
        assertFalse(address.matches(candidate().put("postalcode", "99999-000")));
    }

    @Test
    void rejectsAnotherState() {
        assertFalse(address.matches(candidate().put("region_a", "MG")));
    }

    @Test
    void parsesOriginWithNeighborhoodAndPostalCode() {
        var result =
                DeliveryAddress.fromOrigin("R. das Flores, s/n - Centro, São Bento - SP, 12345-000");
        assertEquals("São Bento", result.city());
        assertEquals("SP", result.region());
        assertEquals("", result.number());
        assertEquals("12345000", result.postalCode());
    }

    @Test
    void parsesSeparateState() {
        var result =
                DeliveryAddress.fromOrigin("Rua das Flores, 100, Centro, São Bento, SP, Brasil");
        assertEquals("São Bento", result.city());
        assertEquals("100", result.number());
    }
}
