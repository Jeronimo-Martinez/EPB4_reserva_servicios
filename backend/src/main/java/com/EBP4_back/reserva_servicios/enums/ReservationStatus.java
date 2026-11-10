package com.EBP4_back.reserva_servicios.enums;

public enum ReservationStatus {
    /** Bloqueo temporal de un cliente que aún no confirma la reserva. */
    PENDIENTE,
    CONFIRMADA,
    CANCELADA,
    ATENDIDA,
    NO_ASISTIDA
}
