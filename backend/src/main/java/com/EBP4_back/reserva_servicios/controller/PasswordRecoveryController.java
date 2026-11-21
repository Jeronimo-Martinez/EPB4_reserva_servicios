package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.PasswordRecoveryRequest;
import com.EBP4_back.reserva_servicios.dto.PasswordRecoveryResponse;
import com.EBP4_back.reserva_servicios.dto.PasswordResetRequest;
import com.EBP4_back.reserva_servicios.dto.VerificationRequest;
import com.EBP4_back.reserva_servicios.service.PasswordRecoveryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** HU-04 Recuperacion de contrasena. Publico: el usuario no tiene sesion (ver SecurityConfig). */
@RestController
@RequestMapping("/api/v1/auth/password-recovery")
public class PasswordRecoveryController {
    private final PasswordRecoveryService recoveryService;

    public PasswordRecoveryController(PasswordRecoveryService recoveryService) {
        this.recoveryService = recoveryService;
    }

    @PostMapping
    public PasswordRecoveryResponse requestCode(@Valid @RequestBody PasswordRecoveryRequest request) {
        return recoveryService.requestCode(request);
    }

    @PostMapping("/verify-code")
    public PasswordRecoveryResponse verifyCode(@Valid @RequestBody VerificationRequest request) {
        return recoveryService.verifyCode(request);
    }

    @PostMapping("/reset")
    public PasswordRecoveryResponse resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        return recoveryService.resetPassword(request);
    }
}
