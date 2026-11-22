package com.EBP4_back.reserva_servicios.service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Correos de la recuperacion de contrasena (HU-04 / HA-04): el codigo, el aviso de cambio y el aviso de bloqueo.
 * Asincrono: la respuesta no espera al proveedor de correo (el codigo llega en segundos) y tarda lo mismo
 * exista o no la cuenta, asi el tiempo de respuesta no revela correos registrados. Sin correo configurado
 * (perfil demo) solo se registra en el log, igual que {@link LoggingVerificationCodeSender}.
 */
@Component
public class PasswordRecoveryNotifier {
    private static final Logger log = LoggerFactory.getLogger(PasswordRecoveryNotifier.class);
    private static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ObjectProvider<MailSender> mailSenders;
    private final boolean mailEnabled;

    public PasswordRecoveryNotifier(ObjectProvider<MailSender> mailSenders,
            @Value("${app.mail.enabled:false}") boolean mailEnabled) {
        this.mailSenders = mailSenders;
        this.mailEnabled = mailEnabled;
    }

    @Async
    public void sendRecoveryCode(String email, String firstName, String code, long validMinutes) {
        if (!canSend()) {
            log.info("Codigo de recuperacion de contrasena generado para {}: {}", email, code);
            return;
        }
        send(email, "Codigo para restablecer tu contrasena ProMarket",
                "Hola " + firstName + ",\n\n"
                + "Recibimos una solicitud para restablecer la contrasena de tu cuenta.\n"
                + "Tu codigo de recuperacion es: " + code + "\n\n"
                + "Vence en " + validMinutes + " minutos y solo se puede usar una vez. Nunca lo compartas con nadie.\n\n"
                + "Si no solicitaste este cambio, ignora este correo: tu contrasena actual sigue funcionando.\n\n"
                + "Equipo ProMarket");
    }

    @Async
    public void notifyPasswordChanged(String email, String firstName) {
        if (!canSend()) {
            log.info("Contrasena actualizada para {}. Aviso por correo omitido (correo no disponible).", email);
            return;
        }
        send(email, "Tu contrasena de ProMarket fue cambiada",
                "Hola " + firstName + ",\n\n"
                + "La contrasena de tu cuenta se cambio el " + now() + " (hora Colombia).\n"
                + "Por seguridad cerramos todas las sesiones abiertas.\n\n"
                + "Si no fuiste tu, recupera tu contrasena de inmediato y revisa la seguridad de tu correo.\n\n"
                + "Equipo ProMarket");
    }

    @Async
    public void notifyRecoveryBlocked(String email, String firstName, long blockMinutes) {
        if (!canSend()) {
            log.warn("Recuperacion de contrasena de {} bloqueada por codigos incorrectos. "
                    + "Aviso por correo omitido (correo no disponible).", email);
            return;
        }
        send(email, "Alerta de seguridad ProMarket: recuperacion de contrasena bloqueada",
                "Hola " + firstName + ",\n\n"
                + "El " + now() + " (hora Colombia) se ingresaron varios codigos incorrectos al intentar "
                + "recuperar la contrasena de tu cuenta.\n"
                + "Por seguridad bloqueamos la recuperacion durante " + blockMinutes + " minutos e invalidamos el codigo enviado.\n\n"
                + "Tu contrasena no ha cambiado. Si no fuiste tu, alguien conoce tu correo: no compartas ningun codigo.\n\n"
                + "Equipo ProMarket");
    }

    private boolean canSend() {
        return mailEnabled && mailSenders.getIfAvailable() != null;
    }

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSenders.getObject().send(message);
            log.info("Correo de recuperacion de contrasena enviado a {}: {}", to, subject);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo '{}' a {}", subject, to, e);
        }
    }

    private static String now() {
        return ZonedDateTime.now(ZONE).format(FMT);
    }
}
