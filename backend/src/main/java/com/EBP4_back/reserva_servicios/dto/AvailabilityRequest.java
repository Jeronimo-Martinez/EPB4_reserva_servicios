package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotNull;

public record AvailabilityRequest(
        @NotNull(message = "Debe indicar la disponibilidad") Boolean available) {
}
