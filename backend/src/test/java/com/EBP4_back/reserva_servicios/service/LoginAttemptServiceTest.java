package com.EBP4_back.reserva_servicios.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

/** Unitario puro (sin contexto Spring) del rate limiting en memoria. */
class LoginAttemptServiceTest {

    private LoginAttemptService attempts;

    @BeforeEach
    void setUp() {
        attempts = new LoginAttemptService(5, 15, 20);
    }

    @Test
    void fifthFailureCrossesThresholdOnce() {
        for (int i = 0; i < 4; i++) {
            assertFalse(attempts.recordFailure("a@example.com", "1.1.1.1"));
        }
        assertTrue(attempts.recordFailure("a@example.com", "1.1.1.1"));
        // Ya bloqueada: no vuelve a notificar
        assertFalse(attempts.recordFailure("a@example.com", "1.1.1.1"));
        assertThrows(ResponseStatusException.class,
                () -> attempts.assertNotBlocked("a@example.com", "1.1.1.1"));
    }

    @Test
    void successClearsAccountCounter() {
        for (int i = 0; i < 4; i++) {
            attempts.recordFailure("b@example.com", "2.2.2.2");
        }
        attempts.recordSuccess("b@example.com");
        assertFalse(attempts.recordFailure("b@example.com", "2.2.2.2"));
        assertDoesNotThrow(() -> attempts.assertNotBlocked("b@example.com", "2.2.2.2"));
    }

    @Test
    void ipBucketBlocksCredentialStuffingAcrossEmails() {
        for (int i = 0; i < 20; i++) {
            attempts.recordFailure("victima" + i + "@example.com", "9.9.9.9");
        }
        assertThrows(ResponseStatusException.class,
                () -> attempts.assertNotBlocked("otra@example.com", "9.9.9.9"));
        // Otra IP no afectada
        assertDoesNotThrow(() -> attempts.assertNotBlocked("otra@example.com", "8.8.8.8"));
    }
}
