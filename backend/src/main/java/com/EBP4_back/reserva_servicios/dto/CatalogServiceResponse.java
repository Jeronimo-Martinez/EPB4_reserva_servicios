package com.EBP4_back.reserva_servicios.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CatalogServiceResponse(
        UUID id,
        String name,
        String description,
        String category,
        int durationMinutes,
        BigDecimal price,
        String currency,
        UUID businessId,
        String businessName,
        String businessCategory,
        boolean available,
        BigDecimal averageRating,
        int reviewCount) {
}
