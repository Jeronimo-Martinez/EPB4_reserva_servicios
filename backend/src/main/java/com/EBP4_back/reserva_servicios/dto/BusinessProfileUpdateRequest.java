package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * HU-06: campos que el proveedor puede cambiar. El correo de la cuenta no esta aqui (HU-06, escenario 3): si llega en
 * el JSON se ignora y nunca se guarda.
 */
public record BusinessProfileUpdateRequest(
        @NotBlank(message = "El nombre del negocio es obligatorio")
        @Size(min = 2, max = 150, message = "El nombre del negocio debe tener entre 2 y 150 caracteres") String name,
        @NotBlank(message = "La categoria del negocio es obligatoria") @Size(max = 100) String category,
        @Size(max = 300, message = "La descripcion no puede superar 300 caracteres") String description,
        @NotBlank(message = "La direccion es obligatoria")
        @Size(max = 255, message = "La direccion no puede superar 255 caracteres") String address,
        @NotBlank(message = "El telefono de contacto es obligatorio")
        @Pattern(regexp = "^\\+?[0-9()\\- ]{7,20}$", message = "El telefono no tiene un formato valido") String phone) {
}
