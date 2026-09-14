package com.EBP4_back.reserva_servicios.registration;

public record RegistrationResponse(String message, String email, boolean verificationRequired) { }