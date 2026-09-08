package com.pizzasystem.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(
        name = "business_hours",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_business_hours_store_day",
                        columnNames = {
                                "store_id",
                                "day_of_week"
                        }
                )
        }
)
public class BusinessHours {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "day_of_week",
            nullable = false
    )
    private DayOfWeek dayOfWeek;

    private LocalTime openingTime;

    private LocalTime closingTime;

    @Column(nullable = false)
    private boolean enabled =
            false;

    // =========================
    // LOJA / TENANT
    // =========================

    /*
     * Temporariamente nullable porque
     * os horários antigos já existem
     * sem store_id.
     */
    @JsonIgnore
    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "store_id"
    )
    private Store store;

    public BusinessHours() {
    }

    public Long getId() {
        return id;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(
            DayOfWeek dayOfWeek
    ) {
        this.dayOfWeek =
                dayOfWeek;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(
            LocalTime openingTime
    ) {
        this.openingTime =
                openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(
            LocalTime closingTime
    ) {
        this.closingTime =
                closingTime;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(
            boolean enabled
    ) {
        this.enabled =
                enabled;
    }

    public Store getStore() {
        return store;
    }

    public void setStore(
            Store store
    ) {
        this.store =
                store;
    }
}