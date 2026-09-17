package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.CatalogSearchResponse;
import com.EBP4_back.reserva_servicios.dto.CatalogServiceResponse;
import com.EBP4_back.reserva_servicios.dto.CategoryResponse;
import com.EBP4_back.reserva_servicios.service.CatalogService;
import com.EBP4_back.reserva_servicios.service.ServiceCatalogService;
import java.util.List;
import java.util.UUID;
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

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return serviceCatalogService.listCategories();
    }
}
