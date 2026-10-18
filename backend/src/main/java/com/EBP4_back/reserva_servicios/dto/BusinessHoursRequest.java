package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BusinessHoursRequest(
        @NotEmpty(message = "Debe seleccionar al menos un dia de atencion") List<DayHours> days) {
}
