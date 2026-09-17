package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.CatalogSearchResponse;
import com.EBP4_back.reserva_servicios.dto.CatalogServiceResponse;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CatalogService {
    private static final String CURRENCY = "COP";
    private static final String SERVICE_NOT_FOUND = "El servicio no existe";
    private final ServiceOfferingRepository serviceRepository;

    public CatalogService(ServiceOfferingRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @Transactional(readOnly = true)
    public CatalogSearchResponse search(String search, String category) {
        String normalizedSearch = normalize(search);
        String normalizedCategory = normalize(category);
        List<CatalogServiceResponse> items = serviceRepository
                .searchCatalog(normalizedSearch, normalizedCategory).stream()
                .map(this::toResponse)
                .toList();
        return new CatalogSearchResponse(items, items.size(), normalizedSearch, normalizedCategory);
    }

    @Transactional(readOnly = true)
    public CatalogServiceResponse getById(UUID id) {
        ServiceOffering service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SERVICE_NOT_FOUND));
        return toResponse(service);
    }

    private CatalogServiceResponse toResponse(ServiceOffering service) {
        Business business = service.getBusiness();
        return new CatalogServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getCategory(),
                service.getDurationMinutes(),
                service.getPrice(),
                CURRENCY,
                business.getId(),
                business.getName(),
                business.getCategory(),
                service.isAvailable(),
                BigDecimal.ZERO,
                0);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
