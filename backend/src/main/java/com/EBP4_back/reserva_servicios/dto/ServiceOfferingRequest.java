package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ServiceOfferingRequest(
        @NotBlank(message = "El correo del proveedor es obligatorio") @Email(message = "El correo del proveedor no tiene un formato valido") String providerEmail,
        @NotBlank(message = "El nombre del servicio es obligatorio") @Size(max = 150) String name,
        @NotBlank(message = "La categoria del servicio es obligatoria") @Size(max = 100) String category,
        @Size(max = 300, message = "La descripcion no puede superar 300 caracteres") String description,
        @NotNull(message = "La duracion es obligatoria") Integer durationMinutes,
        @NotNull(message = "El precio es obligatorio") BigDecimal price,
        Boolean available) {
}
