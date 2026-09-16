package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistrationRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no tiene un formato valido") String email,
        @NotBlank(message = "El telefono es obligatorio") @Pattern(regexp = "^\\+?[0-9()\\- ]{7,20}$", message = "El telefono no tiene un formato valido") String phone,
        @NotBlank(message = "La contrasena es obligatoria") String password,
        @NotNull(message = "Debe aceptar los terminos y condiciones") Boolean termsAccepted) {
}