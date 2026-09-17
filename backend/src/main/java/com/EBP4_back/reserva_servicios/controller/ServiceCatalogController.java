package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.AvailabilityRequest;
import com.EBP4_back.reserva_servicios.dto.CategoryResponse;
import com.EBP4_back.reserva_servicios.dto.ServiceOfferingRequest;
import com.EBP4_back.reserva_servicios.dto.ServiceOfferingResponse;
import com.EBP4_back.reserva_servicios.service.ServiceCatalogService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/services")
public class ServiceCatalogController {
    private final ServiceCatalogService serviceCatalogService;

    public ServiceCatalogController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceOfferingResponse create(@Valid @RequestBody ServiceOfferingRequest request) {
        return serviceCatalogService.create(request);
    }

    @GetMapping
    public List<ServiceOfferingResponse> list(@RequestParam("providerEmail") String providerEmail) {
        return serviceCatalogService.listByProvider(providerEmail);
    }

    @PutMapping("/{id}")
    public ServiceOfferingResponse update(@PathVariable UUID id,
            @Valid @RequestBody ServiceOfferingRequest request) {
        return serviceCatalogService.update(id, request);
    }

    @PatchMapping("/{id}/availability")
    public ServiceOfferingResponse changeAvailability(@PathVariable UUID id,
            @Valid @RequestBody AvailabilityRequest request) {
        return serviceCatalogService.changeAvailability(id, request.providerEmail(), request.available());
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return serviceCatalogService.listCategories();
    }
}
