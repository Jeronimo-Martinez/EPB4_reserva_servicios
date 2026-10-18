package com.EBP4_back.reserva_servicios.service;

import java.time.Instant;
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
 * Avisa al dueno de la cuenta cuando su acceso es bloqueado por
 * multiples contrasenas incorrectas (historia de abuso), y al equipo
 * de seguridad cuando se bloquea por intentos de acceso no autorizado (HA-29).
 * Fire-and-forget: asincrono y defensivo, un fallo de SMTP nunca
 * rompe ni ralentiza el flujo de login. Tolera que no exista
 * MailSender (p. ej. perfil demo sin correo) para no impedir
 * el arranque del contexto.
 */
@Component
public class SuspiciousLoginNotifier {

    private static final Logger log = LoggerFactory.getLogger(SuspiciousLoginNotifier.class);
    private static final ZoneId ZONE = ZoneId.of("America/Bogota");
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ObjectProvider<MailSender> mailSenders;
    private final boolean mailEnabled;
    private final String alertEmail;

    public SuspiciousLoginNotifier(
            ObjectProvider<MailSender> mailSenders,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.security.alert-email:}") String alertEmail) {
        this.mailSenders = mailSenders;
        this.mailEnabled = mailEnabled;
        this.alertEmail = alertEmail;
    }

    /** HA-29: avisa al equipo de seguridad que una cuenta fue bloqueada por intentos de acceso no autorizado. */
    @Async
    public void notifyAccessBlocked(String email, int attempts, String lastAction, String lastResource, Instant until) {
        String text = "La cuenta " + email + " fue bloqueada hasta el " + until.atZone(ZONE).format(FMT)
                + " (hora Colombia) tras " + attempts + " intentos de acceso no autorizado.\n"
                + "Ultimo intento: " + lastAction + " sobre " + lastResource + ".\n\n"
                + "Revisa las lineas ACCESO_DENEGADO de este usuario en el log AUDIT del backend.\n\n"
                + "Equipo ProMarket";
        MailSender mailSender = mailSenders.getIfAvailable();
        if (!mailEnabled || mailSender == null || alertEmail.isBlank()) {
            log.warn("ALERTA_SEGURIDAD sin correo (configura SECURITY_ALERT_EMAIL): {}", text);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(alertEmail);
            message.setSubject("Alerta de seguridad ProMarket: posible elevacion de privilegios");
            message.setText(text);
            mailSender.send(message);
            log.info("Alerta de seguridad enviada a {} por la cuenta {}", alertEmail, email);
        } catch (Exception e) {
            log.error("No se pudo enviar la alerta de seguridad por la cuenta {}", email, e);
        }
    }

    @Async
    public void notifyBlockedAccount(String email, String clientIp) {
        MailSender mailSender = mailSenders.getIfAvailable();
        if (!mailEnabled || mailSender == null) {
            log.warn("Cuenta {} bloqueada por intentos fallidos desde IP {}. "
                    + "Aviso por correo omitido (correo no disponible).", email, clientIp);
            return;
        }
        try {
            String when = ZonedDateTime.now(ZONE).format(FMT);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Alerta de seguridad ProMarket: acceso bloqueado temporalmente");
            message.setText("Hola,\n\nDetectamos varios intentos fallidos de inicio de sesion en tu cuenta "
                    + "el " + when + " (hora Colombia) desde la direccion IP " + clientIp + ".\n"
                    + "Por seguridad bloqueamos temporalmente el acceso.\n\n"
                    + "Si fuiste tu, espera unos minutos e intenta de nuevo. "
                    + "Si no reconoces esta actividad, cambia tu contrasena cuanto antes.\n\n"
                    + "Equipo ProMarket");
            mailSender.send(message);
            log.info("Aviso de bloqueo enviado a {}", email);
        } catch (Exception e) {
            log.error("No se pudo enviar el aviso de bloqueo a {}", email, e);
        }
    }
}
