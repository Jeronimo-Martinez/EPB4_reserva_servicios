package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.entity.Reservation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class ReservationNotifier {
    private static final Logger log = LoggerFactory.getLogger(ReservationNotifier.class);
    private final ObjectProvider<JavaMailSender> mailSender;

    public ReservationNotifier(ObjectProvider<JavaMailSender> mailSender) {
        this.mailSender = mailSender;
    }

    public void notifyProvider(Reservation reservation) {
        String providerEmail = reservation.getService().getBusiness().getUser().getEmail();
        String text = "Nueva reserva confirmada: %s para %s el %s (id %s)".formatted(
                reservation.getClient().getEmail(), reservation.getService().getName(),
                reservation.getStartAt(), reservation.getId());
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("Notificacion de reserva para {}: {}", providerEmail, text);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(providerEmail);
        message.setSubject("Nueva reserva en ProMarket");
        message.setText(text);
        try {
            sender.send(message);
        } catch (MailException exception) {
            // A failed email must not roll back a confirmed reservation.
            log.warn("No se pudo notificar al proveedor {}: {}", providerEmail, exception.getMessage());
        }
    }
}
