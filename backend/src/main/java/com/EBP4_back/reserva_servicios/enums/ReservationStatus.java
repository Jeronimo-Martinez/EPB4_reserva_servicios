package com.EBP4_back.reserva_servicios.enums;

public enum ReservationStatus {
    PENDIENTE,
    CONFIRMADA,
    CANCELADA,
    // HU-22: estados finales de una cita confirmada. Los asigna la HU de registro de asistencia (aun no implementada);
    // mientras tanto solo existen para que el historial pueda mostrarlos y filtrarlos.
    ATENDIDA,
    NO_ASISTIO
}
