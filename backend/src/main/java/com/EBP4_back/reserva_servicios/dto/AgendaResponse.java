package com.EBP4_back.reserva_servicios.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AgendaResponse(
        String view,
        LocalDate from,
        LocalDate to,
        String timeZone,
        String message,
        List<Day> days) {

    // openTime/closeTime are null when the business does not attend that day.
    public record Day(LocalDate date, LocalTime openTime, LocalTime closeTime, List<Entry> reservations) { }

    public record Entry(
            UUID id,
            String clientName,
            String clientEmail,
            String serviceName,
            Instant startAt,
            Instant endAt,
            int durationMinutes,
            String status) { }
}
