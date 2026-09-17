package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendCodeRequest(
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato valido") String email) {
}
