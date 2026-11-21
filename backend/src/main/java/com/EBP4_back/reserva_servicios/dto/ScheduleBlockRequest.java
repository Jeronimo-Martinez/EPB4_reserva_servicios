package com.EBP4_back.reserva_servicios.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Without times the block covers whole days (startDate 00:00 to the end of endDate); with both times it runs
 * from startDate startTime to endDate endTime. confirmConflicts accepts the warning about scheduled reservations.
 */
public record ScheduleBlockRequest(
        @NotNull(message = "Indica la fecha inicial") LocalDate startDate,
        @NotNull(message = "Indica la fecha final") LocalDate endDate,
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 250, message = "El motivo no puede superar 250 caracteres") String reason,
        boolean confirmConflicts) {
}
