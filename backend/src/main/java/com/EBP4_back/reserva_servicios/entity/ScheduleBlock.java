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
import java.time.Instant;
import java.util.UUID;

/** Period in which the provider does not accept reservations (HU-10). */
@Entity
@Table(name = "schedule_blocks")
public class ScheduleBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;
    @Column(name = "start_at", nullable = false)
    private Instant startAt;
    @Column(name = "end_at", nullable = false)
    private Instant endAt;
    // Internal note: clients only see the period as unavailable.
    @Column(length = 250)
    private String reason;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ScheduleBlock() { }

    public ScheduleBlock(Business business, Instant startAt, Instant endAt, String reason) {
        this.business = business;
        this.startAt = startAt;
        this.endAt = endAt;
        this.reason = reason;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public String getReason() { return reason; }
}
