package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record ReservationHoldRequest(
        @NotBlank(message = "Debe iniciar sesion para reservar") @Email(message = "El correo del cliente no tiene un formato valido") String clientEmail,
        @NotNull(message = "Debe seleccionar un servicio") UUID serviceId,
        @NotNull(message = "Debe seleccionar la fecha y la hora") Instant startAt) {
}
