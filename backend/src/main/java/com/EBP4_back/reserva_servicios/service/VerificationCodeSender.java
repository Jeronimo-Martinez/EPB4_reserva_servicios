package com.EBP4_back.reserva_servicios.service;

public interface VerificationCodeSender {
    void send(String email, String code);
}