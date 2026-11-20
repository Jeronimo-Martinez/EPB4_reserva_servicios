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

    // openTime/closeTime are null when the business does not attend that day; blocks are clipped to that day.
    public record Day(LocalDate date, LocalTime openTime, LocalTime closeTime, List<Entry> reservations,
            List<Block> blocks) { }

    public record Block(UUID id, Instant startAt, Instant endAt, String reason) { }

    public record Entry(
            UUID id,
            String clientName,
            String clientEmail,
            String clientPhone,
            String serviceName,
            Instant startAt,
            Instant endAt,
            int durationMinutes,
            String status) { }
}
