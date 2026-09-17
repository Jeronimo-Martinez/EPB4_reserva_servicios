package com.EBP4_back.reserva_servicios.dto;

import java.util.List;

public record CatalogSearchResponse(
        List<CatalogServiceResponse> items,
        int total,
        String appliedSearch,
        String appliedCategory) {
}
