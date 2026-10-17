package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BusinessHoursRequest(
        @NotBlank(message = "El correo del proveedor es obligatorio") @Email(message = "El correo del proveedor no tiene un formato valido") String providerEmail,
        @NotEmpty(message = "Debe seleccionar al menos un dia de atencion") List<DayHours> days) {
}
