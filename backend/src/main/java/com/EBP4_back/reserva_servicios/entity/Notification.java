package com.EBP4_back.reserva_servicios.entity;

import com.EBP4_back.reserva_servicios.enums.NotificationType;
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
import java.time.Instant;
import java.util.UUID;

/** In-app notification (HU-24). The texts are stored as sent, so later changes to the reservation do not rewrite history. */
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;
    @Column(nullable = false, length = 300)
    private String title;
    @Column(nullable = false, length = 500)
    private String body;
    @Column(length = 400)
    private String detail;
    @Column(name = "read_at")
    private Instant readAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Notification() { }

    public Notification(User recipient, NotificationType type, String title, String body, String detail) {
        this.recipient = recipient;
        this.type = type;
        this.title = title;
        this.body = body;
        this.detail = detail;
        this.createdAt = Instant.now();
    }

    public void markRead() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public User getRecipient() { return recipient; }
    public NotificationType getType() { return type; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getDetail() { return detail; }
    public boolean isRead() { return readAt != null; }
    public Instant getCreatedAt() { return createdAt; }
}
