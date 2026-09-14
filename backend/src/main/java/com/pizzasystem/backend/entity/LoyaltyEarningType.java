package com.pizzasystem.backend.entity;

public enum LoyaltyEarningType {

    /*
     * Exemplo:
     * cada pedido aprovado gera 1 selo.
     */
    PER_ORDER,

    /*
     * Exemplo:
     * a cada R$ 20 pagos gera 1 ponto.
     */
    PER_AMOUNT
}