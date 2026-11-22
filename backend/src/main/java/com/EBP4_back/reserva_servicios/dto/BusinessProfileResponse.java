package com.EBP4_back.reserva_servicios.dto;

import java.util.UUID;

/** HU-06: perfil del negocio. {@code email} es el correo de la cuenta y es de solo lectura. */
public record BusinessProfileResponse(
        String message,
        UUID businessId,
        String name,
        String category,
        String description,
        String address,
        String phone,
        String email) {
}
