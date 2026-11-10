package com.EBP4_back.reserva_servicios.dto;

import java.util.List;

public record BusinessHoursResponse(String message, String timeZone, List<DayHours> days) {
}
