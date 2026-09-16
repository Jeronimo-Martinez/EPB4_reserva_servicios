package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.RegistrationRequest;
import com.EBP4_back.reserva_servicios.dto.RegistrationResponse;
import com.EBP4_back.reserva_servicios.dto.VerificationRequest;
import com.EBP4_back.reserva_servicios.dto.VerificationResponse;
import com.EBP4_back.reserva_servicios.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/registrations")
public class RegistrationController {
    private final RegistrationService registrationService;
    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(@Valid @RequestBody RegistrationRequest request) {
        return registrationService.register(request);
    }
    @PostMapping("/verify")
    public VerificationResponse verify(@Valid @RequestBody VerificationRequest request) {
        return registrationService.verify(request);
    }
}