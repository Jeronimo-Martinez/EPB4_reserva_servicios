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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Codigo de recuperacion de contrasena (HU-04 / HA-04). Solo se guarda el SHA-256 del codigo,
 * de modo que una fuga de la base de datos no expone codigos vigentes. Es de un solo uso.
 */
@Entity
@Table(name = "password_reset_codes")
public class PasswordResetCode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "code_hash", nullable = false, length = 64)
    private String codeHash;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "is_used", nullable = false)
    private boolean used;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PasswordResetCode() { }

    public PasswordResetCode(User user, String code, Instant expiresAt) {
        this.user = user;
        this.codeHash = digest(code);
        this.expiresAt = expiresAt;
        this.used = false;
        this.createdAt = Instant.now();
    }

    /** Compara en tiempo constante para no filtrar el codigo por diferencias de tiempo. */
    public boolean matches(String candidate) {
        return candidate != null && MessageDigest.isEqual(
                codeHash.getBytes(StandardCharsets.UTF_8), digest(candidate).getBytes(StandardCharsets.UTF_8));
    }

    public boolean isExpired(Instant now) { return !expiresAt.isAfter(now); }
    public boolean isUsed() { return used; }
    public void markUsed() { this.used = true; }
    public User getUser() { return user; }

    private static String digest(String code) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(code.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible", exception);
        }
    }
}
