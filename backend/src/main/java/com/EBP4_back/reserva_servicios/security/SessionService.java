package com.EBP4_back.reserva_servicios.security;

import com.EBP4_back.reserva_servicios.entity.AuthSession;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.repository.AuthSessionRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Issues, resolves and revokes opaque session tokens (256 random bits each). */
@Service
public class SessionService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final AuthSessionRepository sessions;
    private final Duration lifetime;

    public SessionService(AuthSessionRepository sessions, @Value("${app.session.hours:12}") long hours) {
        this.sessions = sessions;
        this.lifetime = Duration.ofHours(hours);
    }

    @Transactional
    public String open(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.save(new AuthSession(hash(token), user, Instant.now().plus(lifetime)));
        return token;
    }

    @Transactional(readOnly = true)
    public Optional<AuthUser> resolve(String token) {
        return sessions.findByTokenHash(hash(token))
                .filter(session -> session.getExpiresAt().isAfter(Instant.now()))
                .map(session -> {
                    User user = session.getUser();
                    return new AuthUser(user.getId(), user.getEmail(), user.getRole());
                });
    }

    @Transactional
    public void close(String token) {
        sessions.deleteByTokenHash(hash(token));
    }

    // Called while a denied request is failing; its own transaction keeps the logout from being rolled back with it.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void closeAll(String email) {
        sessions.deleteAllByUserEmailIgnoreCase(email);
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible", exception);
        }
    }
}
