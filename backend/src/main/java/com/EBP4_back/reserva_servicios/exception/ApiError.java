package com.EBP4_back.reserva_servicios.exception;

public record ApiError(int status, String message) {
}