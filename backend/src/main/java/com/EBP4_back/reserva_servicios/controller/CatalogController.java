package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.AvailabilityResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessDetailResponse;
import com.EBP4_back.reserva_servicios.dto.CatalogSearchResponse;
import com.EBP4_back.reserva_servicios.dto.CatalogServiceResponse;
import com.EBP4_back.reserva_servicios.dto.CategoryResponse;
import com.EBP4_back.reserva_servicios.dto.CategoryStatResponse;
import com.EBP4_back.reserva_servicios.service.CatalogService;
import com.EBP4_back.reserva_servicios.service.ServiceCatalogService;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {
    private final CatalogService catalogService;
    private final ServiceCatalogService serviceCatalogService;

    public CatalogController(CatalogService catalogService, ServiceCatalogService serviceCatalogService) {
        this.catalogService = catalogService;
        this.serviceCatalogService = serviceCatalogService;
    }

    @GetMapping
    public CatalogSearchResponse search(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category) {
        return catalogService.search(search, category);
    }

    @GetMapping("/{id}")
    public CatalogServiceResponse detail(@PathVariable UUID id) {
        return catalogService.getById(id);
    }

    @GetMapping("/{id}/availability")
    public AvailabilityResponse availability(@PathVariable UUID id,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return catalogService.availability(id, from, to);
    }

    @GetMapping("/businesses")
    public List<BusinessDetailResponse> businesses(@RequestParam(value = "search", required = false) String search) {
        return catalogService.searchBusinesses(search);
    }

    @GetMapping("/businesses/{id}")
    public BusinessDetailResponse business(@PathVariable UUID id) {
        return catalogService.getBusiness(id);
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return serviceCatalogService.listCategories();
    }

    @GetMapping("/category-stats")
    public List<CategoryStatResponse> categoryStats() {
        return catalogService.categoryStats();
    }
}
