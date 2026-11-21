package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Same rules as the registration. Email and role are not here: they cannot be changed (HU-05, escenario 3). */
public record ProfileUpdateRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100, message = "El nombre no puede superar 100 caracteres") String firstName,
        @Size(max = 100, message = "El apellido no puede superar 100 caracteres") String lastName,
        @NotBlank(message = "El telefono es obligatorio") @Pattern(regexp = "^\\+?[0-9()\\- ]{7,20}$", message = "El telefono no tiene un formato valido") String phone) {
}
