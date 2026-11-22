package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.Notification;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.NotificationType;
import com.EBP4_back.reserva_servicios.repository.NotificationRepository;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Component;

/** HU-24: every reservation event becomes an in-app notification and an email with the same text. */
@Component
public class ReservationNotifier {
    private static final Logger log = LoggerFactory.getLogger(ReservationNotifier.class);
    private static final Locale SPANISH = Locale.forLanguageTag("es-CO");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", SPANISH).withZone(Business.ZONE);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm").withZone(Business.ZONE);
    private static final DateTimeFormatter SHORT = DateTimeFormatter.ofPattern("d 'de' MMMM, HH:mm", SPANISH).withZone(Business.ZONE);
    private final ObjectProvider<MailSender> mailSender;
    private final boolean mailEnabled;
    private final NotificationRepository notifications;

    public ReservationNotifier(ObjectProvider<MailSender> mailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled, NotificationRepository notifications) {
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
        this.notifications = notifications;
    }

    public void notifyProvider(Reservation reservation) {
        notify(provider(reservation), NotificationType.NUEVA_RESERVA, "Nueva reserva de " + clientName(reservation),
                clientName(reservation) + " agendó " + service(reservation) + ".", when(reservation.getStartAt()));
    }

    /** HU-19 / HU-24: both sides learn the previous slot (now free) and the new one, start and end. */
    public void notifyRescheduled(Reservation reservation, Instant previousStartAt, Instant previousEndAt) {
        String change = "Horario anterior: " + range(previousStartAt, previousEndAt)
                + " · Nuevo horario: " + range(reservation.getStartAt(), reservation.getEndAt()) + ".";
        notify(reservation.getClient(), NotificationType.REPROGRAMACION, "Tu reserva fue reprogramada", change,
                business(reservation) + " · " + service(reservation));
        notify(provider(reservation), NotificationType.REPROGRAMACION, clientName(reservation) + " reprogramó su reserva",
                change, service(reservation));
    }

    /** "23 de julio, 10:00 – 11:00" in Bogota time. */
    private static String range(Instant start, Instant end) {
        return SHORT.format(start) + " – " + TIME.format(end);
    }

    /** HU-20: the client learns the provider cancelled, with the reason when there is one. */
    public void notifyCancelledByProvider(Reservation reservation) {
        String reason = reservation.getCancellationReason();
        notify(reservation.getClient(), NotificationType.CANCELACION_PROVEEDOR, business(reservation) + " canceló tu reserva",
                reason == null ? "El proveedor no indicó un motivo." : "Motivo: " + reason,
                service(reservation) + " · " + when(reservation.getStartAt()));
    }

    public void notifyCancelledByClient(Reservation reservation) {
        notify(provider(reservation), NotificationType.CANCELACION_CLIENTE, clientName(reservation) + " canceló su reserva",
                "El horario quedó disponible para otros clientes.",
                service(reservation) + " · " + when(reservation.getStartAt()));
    }

    public void remindClient(Reservation reservation) {
        notify(reservation.getClient(), NotificationType.RECORDATORIO, "Tu cita es mañana",
                "Te esperamos en " + business(reservation) + " para tu " + service(reservation).toLowerCase(SPANISH) + ".",
                when(reservation.getStartAt()));
    }

    /** "Miércoles, 23 de julio · 10:00" in Bogota time. */
    private static String when(Instant instant) {
        String day = DAY.format(instant);
        return Character.toUpperCase(day.charAt(0)) + day.substring(1) + " · " + TIME.format(instant);
    }

    private static User provider(Reservation reservation) {
        return reservation.getService().getBusiness().getUser();
    }

    private static String business(Reservation reservation) {
        return reservation.getService().getBusiness().getName();
    }

    private static String service(Reservation reservation) {
        return reservation.getService().getName();
    }

    private static String clientName(Reservation reservation) {
        User client = reservation.getClient();
        return client.getLastName() == null ? client.getFirstName() : client.getFirstName() + " " + client.getLastName();
    }

    // Saved in the caller's transaction, so a change that rolls back leaves no notification behind.
    private void notify(User recipient, NotificationType type, String title, String body, String detail) {
        notifications.save(new Notification(recipient, type, title, body, detail));
        send(recipient.getEmail(), "ProMarket: " + title, title + "\n" + body + "\n" + detail);
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
            // A failed email must not roll back the reservation change; the in-app notification is still there.
            log.warn("No se pudo notificar a {}: {}", to, exception.getMessage());
        }
    }
}
