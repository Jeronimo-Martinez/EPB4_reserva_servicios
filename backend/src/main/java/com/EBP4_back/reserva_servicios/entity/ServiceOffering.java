package com.EBP4_back.reserva_servicios.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "services")
public class ServiceOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(nullable = false, length = 100)
    private String category;
    @Column(length = 300)
    private String description;
    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    @Column(name = "is_available", nullable = false)
    private boolean available;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ServiceOffering() { }

    public ServiceOffering(Business business, String name, String category, String description,
            int durationMinutes, BigDecimal price, boolean available) {
        this.business = business;
        this.name = name;
        this.category = category;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.available = available;
        this.createdAt = Instant.now();
    }

    public void updateDetails(String name, String category, String description,
            int durationMinutes, BigDecimal price, boolean available) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.price = price;
        this.available = available;
    }

    public void changeAvailability(boolean available) {
        this.available = available;
    }

    public UUID getId() { return id; }
    public Business getBusiness() { return business; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public int getDurationMinutes() { return durationMinutes; }
    public BigDecimal getPrice() { return price; }
    public boolean isAvailable() { return available; }
    public Instant getCreatedAt() { return createdAt; }
}
