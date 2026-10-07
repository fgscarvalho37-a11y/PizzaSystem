package com.pizzasystem.backend;

import com.pizzasystem.backend.dto.OrderRequest;
import com.pizzasystem.backend.entity.FulfillmentType;
import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.PaymentTiming;
import com.pizzasystem.backend.entity.Store;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PickupModelTest {

    @Test
    void legacyOrdersDefaultToDeliveryAndOnlinePayment() {
        Order order =
                new Order();

        assertEquals(
                FulfillmentType.DELIVERY,
                order.getFulfillmentType()
        );

        assertEquals(
                PaymentTiming.ONLINE,
                order.getPaymentTiming()
        );
    }

    @Test
    void legacyOrderRequestsDefaultToDelivery() {
        OrderRequest request =
                new OrderRequest();

        assertEquals(
                FulfillmentType.DELIVERY,
                request.getFulfillmentType()
        );

        assertEquals(
                PaymentTiming.ONLINE,
                request.getPaymentTiming()
        );
    }

    @Test
    void storesKeepDeliveryEnabledAndPickupOptIn() {
        Store store =
                new Store();

        assertTrue(
                store.isDeliveryEnabled()
        );

        assertFalse(
                store.isPickupEnabled()
        );

        assertTrue(
                store.isPickupOnlinePaymentEnabled()
        );

        assertTrue(
                store.isPickupPayAtStoreEnabled()
        );

        assertEquals(
                30,
                store.getPickupPreparationMinutes()
        );
    }

    @Test
    void pickupCanUsePayAtStoreWithoutChangingLegacyDefaults() {
        Order order =
                new Order();

        order.setFulfillmentType(
                FulfillmentType.PICKUP
        );

        order.setPaymentTiming(
                PaymentTiming.ON_PICKUP
        );

        assertEquals(
                FulfillmentType.PICKUP,
                order.getFulfillmentType()
        );

        assertEquals(
                PaymentTiming.ON_PICKUP,
                order.getPaymentTiming()
        );
    }
}
