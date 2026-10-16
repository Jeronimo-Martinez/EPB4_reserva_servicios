package com.EBP4_back.reserva_servicios.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record DayHours(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {
}
