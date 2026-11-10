package com.EBP4_back.reserva_servicios.security;

import com.EBP4_back.reserva_servicios.enums.UserRole;
import java.util.UUID;

/** Identity taken from the session token; controllers trust this, never an email sent by the browser. */
public record AuthUser(UUID id, String email, UserRole role) {
}
