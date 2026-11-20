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
    private static final int MAX_FAILED_ATTEMPTS = 5;
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
    // Nullable so ddl-auto=update can add the column to rows that already exist; null means no wrong guesses yet.
    @Column(name = "failed_attempts")
    private Integer failedAttempts;

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

    /**
     * Counts a wrong guess. After MAX_FAILED_ATTEMPTS the code dies, so guessing a 6-digit code needs new codes,
     * and those are limited per hour. Returns true when this guess killed the code.
     */
    public boolean recordFailure() {
        failedAttempts = (failedAttempts == null ? 0 : failedAttempts) + 1;
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            used = true;
        }
        return used;
    }
    public String getCode() { return code; }
}