package com.EBP4_back.reserva_servicios.dto;

public record LoginResponse(
        String message,
        String email,
        String role,
        String redirectTo) {
}