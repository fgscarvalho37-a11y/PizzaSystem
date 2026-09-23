package com.pizzasystem.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderItemRequest {

    private Long productId;

    private Integer quantity;

    private String observation;

    // =========================
    // ADICIONAIS
    // =========================

    /*
     * IDs dos adicionais escolhidos
     * pelo cliente.
     *
     * Exemplo:
     *
     * [
     *   1,
     *   3,
     *   7
     * ]
     *
     * O backend vai validar:
     *
     * - se pertencem à mesma loja
     * - se pertencem a grupos do produto
     * - se estão ativos
     * - mínimo/máximo de cada grupo
     * - preço real no banco
     *
     * O frontend nunca informa
     * o preço do adicional.
     */
    private List<Long> addonIds =
            new ArrayList<>();

    // =========================
    // BORDA LEGADA
    // =========================

    /*
     * Mantido temporariamente para
     * não quebrar o cardápio antigo.
     *
     * Depois que a migração estiver
     * concluída, bordas serão apenas
     * grupos de adicionais.
     */
    private Long crustId;

    public Long getProductId() {
        return productId;
    }

    public void setProductId(
            Long productId
    ) {
        this.productId =
                productId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(
            Integer quantity
    ) {
        this.quantity =
                quantity;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(
            String observation
    ) {
        this.observation =
                observation;
    }

    public List<Long> getAddonIds() {
        return addonIds;
    }

    public void setAddonIds(
            List<Long> addonIds
    ) {
        this.addonIds =
                addonIds != null
                        ? addonIds
                        : new ArrayList<>();
    }

    public Long getCrustId() {
        return crustId;
    }

    public void setCrustId(
            Long crustId
    ) {
        this.crustId =
                crustId;
    }
}