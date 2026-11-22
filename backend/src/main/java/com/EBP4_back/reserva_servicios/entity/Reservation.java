package com.EBP4_back.reserva_servicios.entity;

import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceOffering service;
    @Column(name = "start_at", nullable = false)
    private Instant startAt;
    @Column(name = "end_at", nullable = false)
    private Instant endAt;
    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservationStatus status;
    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    // History of a cancellation (HU-20): who started it, why and when.
    @Enumerated(EnumType.STRING)
    @Column(name = "cancelled_by", length = 20)
    private UserRole cancelledBy;
    @Column(name = "cancellation_reason", length = 250)
    private String cancellationReason;
    @Column(name = "cancelled_at")
    private Instant cancelledAt;
    // HU-24: set once the day-before reminder went out, so the hourly job never sends it twice.
    @Column(name = "reminder_sent_at")
    private Instant reminderSentAt;

    protected Reservation() { }

    public Reservation(User client, ServiceOffering service, Instant startAt, Instant holdExpiresAt) {
        this.client = client;
        this.service = service;
        this.startAt = startAt;
        this.endAt = startAt.plusSeconds(service.getDurationMinutes() * 60L);
        this.totalPrice = service.getPrice();
        this.status = ReservationStatus.PENDIENTE;
        this.holdExpiresAt = holdExpiresAt;
        this.createdAt = Instant.now();
    }

    public boolean isHoldExpired(Instant now) {
        return status == ReservationStatus.PENDIENTE && !holdExpiresAt.isAfter(now);
    }

    public void confirm() {
        this.status = ReservationStatus.CONFIRMADA;
        this.holdExpiresAt = null;
    }

    /** A reservation that already started (or passed) can no longer be rescheduled or cancelled. */
    public boolean hasStarted(Instant now) {
        return !startAt.isAfter(now);
    }

    public void reschedule(Instant newStartAt) {
        this.endAt = newStartAt.plus(Duration.between(startAt, endAt));
        this.startAt = newStartAt;
        // The new date gets its own reminder.
        this.reminderSentAt = null;
    }

    public void markReminded() {
        this.reminderSentAt = Instant.now();
    }

    public void cancel(UserRole by, String reason) {
        this.status = ReservationStatus.CANCELADA;
        this.cancelledBy = by;
        this.cancellationReason = reason;
        this.cancelledAt = Instant.now();
    }

    public UUID getId() { return id; }
    public User getClient() { return client; }
    public ServiceOffering getService() { return service; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public ReservationStatus getStatus() { return status; }
    public Instant getHoldExpiresAt() { return holdExpiresAt; }
    public UserRole getCancelledBy() { return cancelledBy; }
    public String getCancellationReason() { return cancellationReason; }
}
