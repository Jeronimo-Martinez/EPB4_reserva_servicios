package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.BusinessProfileResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessProfileUpdateRequest;
import com.EBP4_back.reserva_servicios.security.AuthUser;
import com.EBP4_back.reserva_servicios.service.BusinessProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** HU-06 "Perfil de mi negocio". Solo proveedores (ver SecurityConfig). */
@RestController
@RequestMapping("/api/v1/business/profile")
public class BusinessProfileController {
    private final BusinessProfileService profileService;

    public BusinessProfileController(BusinessProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public BusinessProfileResponse get(@AuthenticationPrincipal AuthUser user) {
        return profileService.get(user.email());
    }

    @PutMapping
    public BusinessProfileResponse update(@Valid @RequestBody BusinessProfileUpdateRequest request,
            @AuthenticationPrincipal AuthUser user) {
        return profileService.update(user.email(), request);
    }
}
