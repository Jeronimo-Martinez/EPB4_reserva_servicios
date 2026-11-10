package com.EBP4_back.reserva_servicios.dto;

public record VerificationResponse(String message, String email, String role, String token,
        String firstName, String lastName, String businessName, String businessCategory) { }
