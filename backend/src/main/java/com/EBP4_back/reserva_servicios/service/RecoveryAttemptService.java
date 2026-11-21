package com.EBP4_back.reserva_servicios.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * HA-04: limite de codigos de recuperacion incorrectos por correo. Al llegar al maximo se bloquea
 * temporalmente la recuperacion. El contador se lleva por correo exista o no la cuenta, para que el
 * bloqueo no revele si el correo esta registrado. En memoria, igual que {@link LoginAttemptService}.
 */
@Service
public class RecoveryAttemptService {
    static final String RECOVERY_BLOCKED =
            "Demasiados codigos incorrectos. La recuperacion de contrasena fue bloqueada temporalmente. Intenta de nuevo mas tarde";

    private final int maxAttempts;
    private final Duration blockDuration;
    private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();

    public RecoveryAttemptService(
            @Value("${app.password-recovery.max-attempts:5}") int maxAttempts,
            @Value("${app.password-recovery.block-minutes:15}") long blockMinutes) {
        this.maxAttempts = maxAttempts;
        this.blockDuration = Duration.ofMinutes(blockMinutes);
    }

    public boolean isBlocked(String email) {
        Attempts record = attempts.get(email);
        return record != null && record.blockedUntil(Instant.now());
    }

    /** Lanza 429 mientras la recuperacion de ese correo este bloqueada. */
    public void assertNotBlocked(String email) {
        if (isBlocked(email)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, RECOVERY_BLOCKED);
        }
    }

    /** @return true solo cuando este fallo activa el bloqueo (para avisar una unica vez al dueno). */
    public boolean recordFailure(String email) {
        Instant now = Instant.now();
        Attempts record = attempts.computeIfAbsent(email, key -> new Attempts());
        synchronized (record) {
            // Los fallos viejos dejan de contar: la ventana dura lo mismo que el bloqueo.
            if (record.windowStart == null || record.windowStart.plus(blockDuration).isBefore(now)) {
                record.windowStart = now;
                record.failures = 0;
            }
            record.failures++;
            if (record.failures >= maxAttempts) {
                record.blockedUntil = now.plus(blockDuration);
                record.windowStart = null;
                return true;
            }
            return false;
        }
    }

    public void reset(String email) {
        attempts.remove(email);
    }

    public long blockMinutes() {
        return blockDuration.toMinutes();
    }

    private static final class Attempts {
        private Instant windowStart;
        private int failures;
        private Instant blockedUntil = Instant.MIN;

        synchronized boolean blockedUntil(Instant now) { return now.isBefore(blockedUntil); }
    }
}
