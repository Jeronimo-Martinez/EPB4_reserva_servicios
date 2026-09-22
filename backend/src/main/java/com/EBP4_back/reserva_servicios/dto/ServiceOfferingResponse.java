package com.EBP4_back.reserva_servicios.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ServiceOfferingResponse(
        UUID id,
        String name,
        String category,
        String description,
        int durationMinutes,
        BigDecimal price,
        boolean available,
        Instant createdAt) {
}
