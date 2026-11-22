package com.EBP4_back.reserva_servicios.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String body,
        String detail,
        boolean read,
        Instant createdAt) {
}
