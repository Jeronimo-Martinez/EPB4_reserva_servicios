package com.EBP4_back.reserva_servicios.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** HU-22: historial de reservas del negocio. {@code message} solo viene cuando la lista esta vacia. */
public record ReservationHistoryResponse(
        String status,
        String message,
        int total,
        List<Item> reservations) {

    public record Item(
            UUID id,
            String code,
            Instant startAt,
            Instant endAt,
            String clientName,
            String serviceName,
            int durationMinutes,
            String status) { }
}
