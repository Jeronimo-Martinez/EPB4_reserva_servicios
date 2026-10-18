package com.EBP4_back.reserva_servicios.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BusinessDetailResponse(
        UUID id,
        String name,
        String category,
        String description,
        String address,
        String phone,
        String email,
        BigDecimal averageRating,
        int reviewCount,
        List<CatalogServiceResponse> services) {
}
