package com.EBP4_back.reserva_servicios.dto;

public record ProfileResponse(
        String message,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        boolean verified) {
}
