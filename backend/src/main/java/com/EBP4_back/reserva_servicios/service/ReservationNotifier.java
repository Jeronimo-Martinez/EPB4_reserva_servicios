package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Component;

@Component
public class ReservationNotifier {
    private static final Logger log = LoggerFactory.getLogger(ReservationNotifier.class);
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Business.ZONE);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm").withZone(Business.ZONE);
    private final ObjectProvider<MailSender> mailSender;
    private final boolean mailEnabled;

    public ReservationNotifier(ObjectProvider<MailSender> mailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled) {
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
    }

    public void notifyProvider(Reservation reservation) {
        send(providerEmail(reservation), "Nueva reserva en ProMarket",
                "Nueva reserva confirmada: %s para %s el %s (hora Colombia) (id %s)".formatted(
                        reservation.getClient().getEmail(), reservation.getService().getName(),
                        WHEN.format(reservation.getStartAt()), reservation.getId()));
    }

    /** HU-19: the provider learns the previous slot (now free) and the new one, start and end. */
    public void notifyRescheduled(Reservation reservation, Instant previousStartAt, Instant previousEndAt) {
        send(providerEmail(reservation), "Reserva reprogramada en ProMarket",
                "%s reprogramo su reserva de %s.%nHorario anterior (liberado): %s%nNuevo horario: %s%nHora Colombia. Reserva %s".formatted(
                        reservation.getClient().getEmail(), reservation.getService().getName(),
                        range(previousStartAt, previousEndAt), range(reservation.getStartAt(), reservation.getEndAt()),
                        reservation.getId()));
    }

    private static String range(Instant start, Instant end) {
        return WHEN.format(start) + " - " + TIME.format(end);
    }

    /** HU-20: the client learns the provider cancelled, with the reason when there is one. */
    public void notifyCancelledByProvider(Reservation reservation) {
        String reason = reservation.getCancellationReason();
        send(reservation.getClient().getEmail(), "Tu reserva fue cancelada por el proveedor",
                "%s cancelo tu reserva de %s del %s (hora Colombia).%s%nEl horario quedo libre; puedes agendar una nueva cita en ProMarket.".formatted(
                        reservation.getService().getBusiness().getName(), reservation.getService().getName(),
                        WHEN.format(reservation.getStartAt()), reason == null ? "" : "%nMotivo: %s".formatted(reason)));
    }

    private static String providerEmail(Reservation reservation) {
        return reservation.getService().getBusiness().getUser().getEmail();
    }

    private void send(String to, String subject, String text) {
        MailSender sender = mailSender.getIfAvailable();
        if (!mailEnabled || sender == null) {
            log.info("Notificacion de reserva para {}: {}", to, text);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            sender.send(message);
        } catch (MailException exception) {
            // A failed email must not roll back the reservation change.
            log.warn("No se pudo notificar a {}: {}", to, exception.getMessage());
        }
    }
}
