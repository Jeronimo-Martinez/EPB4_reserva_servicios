package com.EBP4_back.reserva_servicios.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Entity
@Table(name = "businesses")
public class Business {
    // shortcut: every business works in Bogota time; add a zone column when providers in other zones appear.
    public static final ZoneId ZONE = ZoneId.of("America/Bogota");

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
    @ElementCollection
    @CollectionTable(name = "business_hours", joinColumns = @JoinColumn(name = "business_id"),
            uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "day_of_week"}))
    private List<BusinessHours> hours = new ArrayList<>();

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

    public void replaceHours(List<BusinessHours> newHours) {
        hours.clear();
        hours.addAll(newHours);
    }

    public Optional<BusinessHours> hoursFor(DayOfWeek day) {
        return hours.stream().filter(h -> h.getDayOfWeek() == day).findFirst();
    }

    public boolean isOpenDuring(Instant startAt, Instant endAt) {
        ZonedDateTime start = startAt.atZone(ZONE);
        ZonedDateTime end = endAt.atZone(ZONE);
        return start.toLocalDate().equals(end.toLocalDate()) && hoursFor(start.getDayOfWeek())
                .filter(h -> !start.toLocalTime().isBefore(h.getStartTime()) && !end.toLocalTime().isAfter(h.getEndTime()))
                .isPresent();
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getAddress() { return address; }
    public Instant getCreatedAt() { return createdAt; }
    public List<BusinessHours> getHours() { return hours; }
}
