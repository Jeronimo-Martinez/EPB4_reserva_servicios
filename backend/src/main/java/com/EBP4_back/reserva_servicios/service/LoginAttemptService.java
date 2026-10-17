package com.EBP4_back.reserva_servicios.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Rate limiting en memoria para el login (historia de abuso / fuerza bruta).
 * Lleva dos contadores con ventana deslizante: por cuenta (email) y por IP.
 * Sin persistencia: al reiniciar el servidor los contadores se pierden
 * (aceptado para este alcance; ver plan en caso de necesitar BD).
 */
@Service
public class LoginAttemptService {

    private static final String TOO_MANY_ATTEMPTS =
            "Demasiados intentos fallidos. Tu acceso fue bloqueado temporalmente. Intenta de nuevo mas tarde";

    private final int maxAttempts;
    private final Duration blockDuration;
    private final int maxAttemptsPerIp;

    private final ConcurrentHashMap<String, AttemptRecord> accounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptRecord> ips = new ConcurrentHashMap<>();

    public LoginAttemptService(
            @Value("${app.login.max-attempts:5}") int maxAttempts,
            @Value("${app.login.block-minutes:15}") long blockMinutes,
            @Value("${app.login.max-attempts-per-ip:20}") int maxAttemptsPerIp) {
        this.maxAttempts = maxAttempts;
        this.blockDuration = Duration.ofMinutes(blockMinutes);
        this.maxAttemptsPerIp = maxAttemptsPerIp;
    }

    /** Lanza 429 si la cuenta o la IP estan bloqueadas. Mensaje generico (anti-enumeracion). */
    public void assertNotBlocked(String email, String ip) {
        Instant now = Instant.now();
        if (isBlocked(accounts.get(emailKey(email)), now) || isBlocked(ips.get(ipKey(ip)), now)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, TOO_MANY_ATTEMPTS);
        }
    }

    /**
     * Registra un fallo contra la cuenta y contra la IP.
     *
     * @return true solo la vez que el fallo cruza el umbral de la cuenta
     *         (para enviar un unico aviso al dueno).
     */
    public boolean recordFailure(String email, String ip) {
        boolean crossed = record(accounts, emailKey(email), maxAttempts);
        record(ips, ipKey(ip), maxAttemptsPerIp);
        return crossed;
    }

    /** Un login exitoso limpia el contador de la cuenta (no el de la IP). */
    public void recordSuccess(String email) {
        accounts.remove(emailKey(email));
    }

    private boolean record(ConcurrentHashMap<String, AttemptRecord> bucket, String key, int limit) {
        Instant now = Instant.now();
        AttemptRecord rec = bucket.computeIfAbsent(key, k -> new AttemptRecord());
        synchronized (rec) {
            prune(rec, now);
            rec.failures().addLast(now);
            if (rec.failures().size() >= limit && !now.isBefore(rec.blockedUntil())) {
                rec.setBlockedUntil(now.plus(blockDuration));
                return true;
            }
            return false;
        }
    }

    private boolean isBlocked(AttemptRecord rec, Instant now) {
        return rec != null && now.isBefore(rec.blockedUntil());
    }

    private void prune(AttemptRecord rec, Instant now) {
        Instant cutoff = now.minus(blockDuration);
        while (!rec.failures().isEmpty() && rec.failures().peekFirst().isBefore(cutoff)) {
            rec.failures().pollFirst();
        }
    }

    private String emailKey(String email) {
        return "acc:" + (email == null ? "" : email.trim().toLowerCase());
    }

    private String ipKey(String ip) {
        return "ip:" + (ip == null || ip.isBlank() ? "unknown" : ip.trim());
    }

    /** Registro mutable protegido con synchronized sobre la instancia. */
    private static final class AttemptRecord {
        private final Deque<Instant> failures = new ArrayDeque<>();
        private Instant blockedUntil = Instant.MIN;

        Deque<Instant> failures() { return failures; }
        Instant blockedUntil() { return blockedUntil; }
        void setBlockedUntil(Instant blockedUntil) { this.blockedUntil = blockedUntil; }
    }
}
