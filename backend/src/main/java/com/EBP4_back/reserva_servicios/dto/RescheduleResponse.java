package com.EBP4_back.reserva_servicios.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * HU-19: horario anterior y nuevo de una reprogramacion. {@code newStartAt}/{@code newEndAt} son nulos cuando
 * la reprogramacion se cancela; {@code holdExpiresAt} solo aplica mientras el cambio espera confirmacion.
 */
public record RescheduleResponse(
        String message,
        UUID reservationId,
        String status,
        String businessName,
        String serviceName,
        int durationMinutes,
        Instant previousStartAt,
        Instant previousEndAt,
        Instant newStartAt,
        Instant newEndAt,
        Instant holdExpiresAt) {
}
