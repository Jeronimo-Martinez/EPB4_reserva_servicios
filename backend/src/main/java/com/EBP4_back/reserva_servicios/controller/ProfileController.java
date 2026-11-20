package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.ProfileResponse;
import com.EBP4_back.reserva_servicios.dto.ProfileUpdateRequest;
import com.EBP4_back.reserva_servicios.security.AuthUser;
import com.EBP4_back.reserva_servicios.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal AuthUser user) {
        return profileService.get(user.id());
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody ProfileUpdateRequest request, @AuthenticationPrincipal AuthUser user) {
        return profileService.update(user.id(), request);
    }
}
