package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ReservationConfirmRequest(
        @NotBlank(message = "Debe iniciar sesion para reservar") @Email(message = "El correo del cliente no tiene un formato valido") String clientEmail) {
}
