package com.pizzasystem.backend.service;

import com.pizzasystem.backend.entity.Order;
import com.pizzasystem.backend.entity.OrderStatus;
import com.pizzasystem.backend.entity.PaymentStatus;

/**
 * Payment notifications may be delivered more than once or arrive after
 * kitchen/delivery operations. Payment updates must not rewind order progress.
 */
public final class PaymentStateGuard {

    private PaymentStateGuard() {
    }

    public static void markApproved(Order order) {
        // A late approval notification must never undo a refund or cancellation.
        if (order.getPaymentStatus() == PaymentStatus.REFUNDED
                || order.getPaymentStatus() == PaymentStatus.CANCELLED) {
            return;
        }

        order.setPaymentStatus(PaymentStatus.APPROVED);

        // Only a new/unpaid order should move to the kitchen queue.
        if (order.getStatus() == null
                || order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.RECEIVED);
        }
    }

    public static void markUnapproved(Order order, PaymentStatus nextPaymentStatus) {
        if (nextPaymentStatus != PaymentStatus.PENDING
                && nextPaymentStatus != PaymentStatus.REJECTED) {
            throw new IllegalArgumentException("Invalid unapproved payment state");
        }

        // Stale provider responses cannot downgrade already settled payments.
        if (order.getPaymentStatus() == PaymentStatus.APPROVED
                || order.getPaymentStatus() == PaymentStatus.REFUNDED
                || order.getPaymentStatus() == PaymentStatus.CANCELLED) {
            return;
        }

        // Never reopen a cancelled, ready or completed order.
        if (order.getStatus() != null
                && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            return;
        }

        order.setPaymentStatus(nextPaymentStatus);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
    }
}
