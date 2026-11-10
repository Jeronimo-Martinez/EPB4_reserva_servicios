package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record ReservationHoldRequest(
        @NotNull(message = "Debe seleccionar un servicio") UUID serviceId,
        @NotNull(message = "Debe seleccionar la fecha y la hora") Instant startAt) {
}
