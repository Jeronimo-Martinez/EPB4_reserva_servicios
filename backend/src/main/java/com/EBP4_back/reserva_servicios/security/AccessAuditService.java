package com.EBP4_back.reserva_servicios.security;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Audit log of denied accesses (HA-29 / HUS-29). Repeated attempts against resources that are not yours
 * close every session of the account and block it for a while.
 * shortcut: counters live in memory (lost on restart, one instance only); move them to the database if the
 * backend ever runs more than one instance.
 */
@Service
public class AccessAuditService {
    public static final String ACCOUNT_BLOCKED =
            "Tu cuenta fue bloqueada temporalmente por intentos repetidos de acceso no autorizado. Intenta mas tarde";
    public static final String NOT_ALLOWED_VIEW = "No tienes permitido acceder a esta información";
    public static final String NOT_ALLOWED_EDIT = "No tienes permitido editar esta información";
    private static final Logger AUDIT = LoggerFactory.getLogger("AUDIT");

    private final SessionService sessions;
    private final int maxDenied;
    private final Duration window;
    private final Map<String, Deque<Instant>> denied = new ConcurrentHashMap<>();
    private final Map<String, Instant> blockedUntil = new ConcurrentHashMap<>();

    public AccessAuditService(SessionService sessions,
            @Value("${app.security.max-denied-access:5}") int maxDenied,
            @Value("${app.security.block-minutes:15}") long blockMinutes) {
        this.sessions = sessions;
        this.maxDenied = maxDenied;
        this.window = Duration.ofMinutes(blockMinutes);
    }

    /** Records the denied attempt and returns the 403 the caller must throw (no data of the resource). */
    public ResponseStatusException deny(String email, String action, String resource, String message) {
        String key = key(email);
        Instant now = Instant.now();
        AUDIT.warn("ACCESO_DENEGADO usuario={} accion={} recurso={}", key, action, resource);
        Deque<Instant> attempts = denied.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (attempts) {
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(now.minus(window))) {
                attempts.pollFirst();
            }
            attempts.addLast(now);
            if (attempts.size() >= maxDenied) {
                attempts.clear();
                blockedUntil.put(key, now.plus(window));
                sessions.closeAll(key);
                AUDIT.warn("CUENTA_BLOQUEADA usuario={} hasta={}", key, now.plus(window));
                return new ResponseStatusException(HttpStatus.FORBIDDEN, ACCOUNT_BLOCKED);
            }
        }
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    public boolean isBlocked(String email) {
        Instant until = blockedUntil.get(key(email));
        return until != null && Instant.now().isBefore(until);
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
