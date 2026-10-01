package com.pizzasystem.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class OrderItemRequest {

    @NotNull(message = "Produto é obrigatório.")
    @Positive(message = "Produto inválido.")
    private Long productId;

    @NotNull(message = "Quantidade é obrigatória.")
    @Min(value = 1, message = "Quantidade inválida.")
    @Max(value = 100, message = "Quantidade acima do limite permitido.")
    private Integer quantity;

    @Size(max = 500, message = "Observação muito longa.")
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
    @Size(max = 100, message = "Quantidade de adicionais acima do limite permitido.")
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
    @Positive(message = "Borda inválida.")
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