package com.EBP4_back.reserva_servicios.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReservationResponse(
        String message,
        UUID id,
        String status,
        String businessName,
        String serviceName,
        int durationMinutes,
        Instant startAt,
        Instant endAt,
        BigDecimal totalPrice,
        String currency,
        Instant holdExpiresAt,
        UUID serviceId,
        // Only for CANCELADA: who cancelled (CLIENTE/PROVEEDOR) and the optional reason sent to the client.
        String cancelledBy,
        String cancellationReason) {
}
