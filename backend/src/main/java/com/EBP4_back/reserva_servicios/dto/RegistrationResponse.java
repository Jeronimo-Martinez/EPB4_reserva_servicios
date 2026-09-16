package com.EBP4_back.reserva_servicios.dto;

public record RegistrationResponse(String message, String email, boolean verificationRequired) { }