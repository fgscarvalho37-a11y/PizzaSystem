package com.pizzasystem.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "store_settings")
public class StoreSettings {

    @Id
    private Long id = 1L;

    @Column(nullable = false)
    private String storeName = "PizzaSystem";

    @Column(nullable = false)
    private boolean open = false;

    private String whatsapp;

    private Integer dailyOrderLimit = 30;

    public StoreSettings() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public boolean isOpen() {
        return open;
    }

    public void setOpen(boolean open) {
        this.open = open;
    }

    public String getWhatsapp() {
        return whatsapp;
    }

    public void setWhatsapp(String whatsapp) {
        this.whatsapp = whatsapp;
    }

    public Integer getDailyOrderLimit() {
        return dailyOrderLimit;
    }

    public void setDailyOrderLimit(Integer dailyOrderLimit) {
        this.dailyOrderLimit = dailyOrderLimit;
    }
}