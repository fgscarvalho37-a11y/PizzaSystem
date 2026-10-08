package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PaymentStateGuardTest {

    @Test
    void approvedPaymentReleasesOnlyPendingOrder() {
        Order order = new Order();
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.PENDING);

        PaymentStateGuard.markApproved(order);

        assertEquals(PaymentStatus.APPROVED, order.getPaymentStatus());
        assertEquals(OrderStatus.RECEIVED, order.getStatus());
    }

    @Test
    void duplicateWebhookDoesNotRewindKitchenOrDeliveredOrders() {
        for (OrderStatus status : new OrderStatus[] {
                OrderStatus.PREPARING, OrderStatus.READY,
                OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED
        }) {
            Order order = new Order();
            order.setStatus(status);
            order.setPaymentStatus(PaymentStatus.APPROVED);

            PaymentStateGuard.markApproved(order);

            assertEquals(status, order.getStatus());
            assertEquals(PaymentStatus.APPROVED, order.getPaymentStatus());
        }
    }

    @Test
    void cancelledOrderIsNotReopenedByLateApproval() {
        Order order = new Order();
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        PaymentStateGuard.markApproved(order);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.APPROVED, order.getPaymentStatus());
    }

    @Test
    void stalePendingOrRejectedUpdatesCannotDowngradePaidOrder() {
        for (PaymentStatus stale : new PaymentStatus[] {
                PaymentStatus.PENDING, PaymentStatus.REJECTED
        }) {
            Order order = new Order();
            order.setStatus(OrderStatus.PREPARING);
            order.setPaymentStatus(PaymentStatus.APPROVED);

            PaymentStateGuard.markUnapproved(order, stale);

            assertEquals(PaymentStatus.APPROVED, order.getPaymentStatus());
            assertEquals(OrderStatus.PREPARING, order.getStatus());
        }
    }

    @Test
    void refundedPaymentsRemainRefundedAfterDuplicateApproval() {
        Order order = new Order();
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);

        PaymentStateGuard.markApproved(order);

        assertEquals(PaymentStatus.REFUNDED, order.getPaymentStatus());
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    @Test
    void genuinelyRejectedPendingPaymentCanBeRetried() {
        Order order = new Order();
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.PENDING);

        PaymentStateGuard.markUnapproved(order, PaymentStatus.REJECTED);

        assertEquals(PaymentStatus.REJECTED, order.getPaymentStatus());
        assertEquals(OrderStatus.PENDING_PAYMENT, order.getStatus());

        PaymentStateGuard.markApproved(order);

        assertEquals(PaymentStatus.APPROVED, order.getPaymentStatus());
        assertEquals(OrderStatus.RECEIVED, order.getStatus());
    }
}
