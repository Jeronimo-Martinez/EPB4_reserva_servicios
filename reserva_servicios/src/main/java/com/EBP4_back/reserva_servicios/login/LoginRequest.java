package com.EBP4_back.reserva_servicios.login;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El correo electronico es obligatorio")
        @Email(message = "El correo no tiene un formato valido")
        String email,
        @NotBlank(message = "La contrasena es obligatoria")
        String password) {
}