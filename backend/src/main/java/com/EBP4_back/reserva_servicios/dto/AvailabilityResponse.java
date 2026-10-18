package com.EBP4_back.reserva_servicios.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AvailabilityResponse(
        UUID serviceId,
        int durationMinutes,
        String timeZone,
        String message,
        List<Day> days) {

    public record Day(LocalDate date, List<Instant> slots) { }
}
