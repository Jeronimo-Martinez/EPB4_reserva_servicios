package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Size;

/** The reason is optional (HU-20, escenario 2). */
public record CancelReservationRequest(
        @Size(max = 250, message = "El motivo no puede superar 250 caracteres") String reason) {
}
