package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AvailabilityRequest(
        @NotBlank(message = "El correo del proveedor es obligatorio") @Email String providerEmail,
        @NotNull(message = "Debe indicar la disponibilidad") Boolean available) {
}
