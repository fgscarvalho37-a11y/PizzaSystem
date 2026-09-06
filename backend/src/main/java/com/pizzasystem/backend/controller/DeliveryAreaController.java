package com.pizzasystem.backend.controller;

import com.pizzasystem.backend.entity.DeliveryArea;
import com.pizzasystem.backend.repository.DeliveryAreaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/delivery-areas")
public class DeliveryAreaController {

    private final DeliveryAreaRepository deliveryAreaRepository;

    public DeliveryAreaController(
            DeliveryAreaRepository deliveryAreaRepository
    ) {
        this.deliveryAreaRepository = deliveryAreaRepository;
    }

    // ADMIN - LISTAR TODAS
    @GetMapping
    public List<DeliveryArea> listAll() {
        return deliveryAreaRepository.findAll();
    }

    // CLIENTE - LISTAR SOMENTE BAIRROS ATIVOS
    @GetMapping("/active")
    public List<DeliveryArea> listActive() {
        return deliveryAreaRepository
                .findByActiveTrueOrderByNeighborhoodAsc();
    }

    // ADMIN - CADASTRAR BAIRRO
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryArea create(
            @RequestBody DeliveryArea deliveryArea
    ) {
        return deliveryAreaRepository.save(deliveryArea);
    }

    // ADMIN - EDITAR BAIRRO
    @PutMapping("/{id}")
    public DeliveryArea update(
            @PathVariable Long id,
            @RequestBody DeliveryArea data
    ) {
        DeliveryArea deliveryArea =
                deliveryAreaRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Área de entrega não encontrada"
                                ));

        deliveryArea.setNeighborhood(data.getNeighborhood());
        deliveryArea.setFee(data.getFee());
        deliveryArea.setActive(data.isActive());

        return deliveryAreaRepository.save(deliveryArea);
    }

    // ADMIN - ATIVAR/DESATIVAR
    @PatchMapping("/{id}/active")
    public DeliveryArea changeActive(
            @PathVariable Long id,
            @RequestParam boolean active
    ) {
        DeliveryArea deliveryArea =
                deliveryAreaRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Área de entrega não encontrada"
                                ));

        deliveryArea.setActive(active);

        return deliveryAreaRepository.save(deliveryArea);
    }
}