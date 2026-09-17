package com.EBP4_back.reserva_servicios.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "businesses")
public class Business {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    @Column(nullable = false, length = 150)
    private String name;
    @Column(nullable = false, length = 100)
    private String category;
    @Column(length = 300)
    private String description;
    @Column(nullable = false, length = 255)
    private String address;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Business() { }

    public Business(User user, String name, String category, String description, String address) {
        this.user = user;
        this.name = name;
        this.category = category;
        this.description = description;
        this.address = address;
        this.createdAt = Instant.now();
    }

    public void updateProfile(String name, String category, String description, String address) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.address = address;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getAddress() { return address; }
    public Instant getCreatedAt() { return createdAt; }
}
