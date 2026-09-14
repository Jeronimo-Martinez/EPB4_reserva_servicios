package com.EBP4_back.reserva_servicios.registration;

public interface VerificationCodeSender {
    void send(String email, String code);
}