package com.EBP4_back.reserva_servicios.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingVerificationCodeSender implements VerificationCodeSender {
    private static final Logger log = LoggerFactory.getLogger(LoggingVerificationCodeSender.class);
    @Override
    public void send(String email, String code) {
        log.info("Codigo de verificacion generado para {}: {}", email, code);
    }
}