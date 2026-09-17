package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.CategoryResponse;
import com.EBP4_back.reserva_servicios.dto.ServiceOfferingRequest;
import com.EBP4_back.reserva_servicios.dto.ServiceOfferingResponse;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.enums.ServiceCategory;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ServiceCatalogService {
    private static final String BUSINESS_NOT_FOUND = "El proveedor no tiene un negocio registrado";
    private static final String SERVICE_NOT_FOUND = "El servicio no existe";
    private static final String OWNERSHIP_ERROR = "El servicio no pertenece al proveedor indicado";
    private static final String INVALID_DURATION = "La duracion debe ser mayor a 0";
    private static final String INVALID_PRICE = "El precio debe ser mayor a 0";
    private final BusinessRepository businessRepository;
    private final ServiceOfferingRepository serviceRepository;

    public ServiceCatalogService(BusinessRepository businessRepository, ServiceOfferingRepository serviceRepository) {
        this.businessRepository = businessRepository;
        this.serviceRepository = serviceRepository;
    }

    @Transactional
    public ServiceOfferingResponse create(ServiceOfferingRequest request) {
        Business business = requireBusiness(request.providerEmail());
        validateDuration(request.durationMinutes());
        validatePrice(request.price());
        ServiceOffering saved = serviceRepository.save(new ServiceOffering(business,
                request.name().trim(),
                request.category().trim(),
                normalize(request.description()),
                request.durationMinutes(),
                request.price(),
                request.available() == null || request.available()));
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ServiceOfferingResponse> listByProvider(String providerEmail) {
        String email = normalizeEmail(providerEmail);
        return serviceRepository.findAllByBusinessUserEmailIgnoreCaseOrderByCreatedAtDesc(email).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ServiceOfferingResponse update(UUID id, ServiceOfferingRequest request) {
        ServiceOffering service = requireService(id);
        assertOwnership(service, request.providerEmail());
        validateDuration(request.durationMinutes());
        validatePrice(request.price());
        service.updateDetails(request.name().trim(),
                request.category().trim(),
                normalize(request.description()),
                request.durationMinutes(),
                request.price(),
                request.available() == null || request.available());
        return toResponse(service);
    }

    @Transactional
    public ServiceOfferingResponse changeAvailability(UUID id, String providerEmail, boolean available) {
        ServiceOffering service = requireService(id);
        assertOwnership(service, providerEmail);
        service.changeAvailability(available);
        return toResponse(service);
    }

    public List<CategoryResponse> listCategories() {
        return Stream.of(ServiceCategory.values())
                .map(cat -> new CategoryResponse(cat.name(), cat.getLabel()))
                .toList();
    }

    private Business requireBusiness(String providerEmail) {
        return businessRepository.findByUserEmailIgnoreCase(normalizeEmail(providerEmail))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, BUSINESS_NOT_FOUND));
    }

    private ServiceOffering requireService(UUID id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SERVICE_NOT_FOUND));
    }

    private void assertOwnership(ServiceOffering service, String providerEmail) {
        String owner = service.getBusiness().getUser().getEmail();
        if (!owner.equalsIgnoreCase(normalizeEmail(providerEmail))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, OWNERSHIP_ERROR);
        }
    }

    private void validateDuration(Integer durationMinutes) {
        if (durationMinutes == null || durationMinutes <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_DURATION);
        }
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_PRICE);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ServiceOfferingResponse toResponse(ServiceOffering service) {
        return new ServiceOfferingResponse(service.getId(), service.getName(), service.getCategory(),
                service.getDescription(), service.getDurationMinutes(), service.getPrice(),
                service.isAvailable(), service.getCreatedAt());
    }
}
