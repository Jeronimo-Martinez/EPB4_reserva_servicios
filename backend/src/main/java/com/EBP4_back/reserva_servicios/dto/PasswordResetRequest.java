package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordResetRequest(
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato valido") String email,
        @NotBlank(message = "El codigo es obligatorio") @Pattern(regexp = "^[0-9]{6}$", message = "El codigo debe tener 6 digitos") String code,
        @NotBlank(message = "La nueva contrasena es obligatoria") String newPassword,
        @NotBlank(message = "Debes confirmar la nueva contrasena") String confirmPassword) {
}
