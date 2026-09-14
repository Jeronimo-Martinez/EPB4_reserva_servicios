package com.EBP4_back.reserva_servicios.registration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "spring.mail", name = "host")
public class MailVerificationCodeSender implements VerificationCodeSender {
    private final JavaMailSender mailSender;

    public MailVerificationCodeSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void send(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Codigo de verificacion ProMarket");
        message.setText("Tu codigo de verificacion es: " + code + ". Tiene una vigencia de 15 minutos.");
        mailSender.send(message);
    }
}