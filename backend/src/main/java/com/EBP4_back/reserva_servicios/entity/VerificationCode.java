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

@Entity
@Table(name = "verification_codes")
public class VerificationCode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, length = 6)
    private String code;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "is_used", nullable = false)
    private boolean used;

    protected VerificationCode() { }

    public VerificationCode(User user, String code, Instant expiresAt) {
        this.user = user;
        this.code = code;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    public boolean isValid(String candidate, Instant now) {
        return !used && expiresAt.isAfter(now) && code.equals(candidate);
    }
    public void markUsed() { this.used = true; }
    public String getCode() { return code; }
}