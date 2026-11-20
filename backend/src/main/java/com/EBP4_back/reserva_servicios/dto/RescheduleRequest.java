package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record RescheduleRequest(@NotNull(message = "Debe seleccionar la nueva fecha y hora") Instant startAt) {
}
