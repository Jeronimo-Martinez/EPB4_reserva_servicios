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
 * Avisa al dueno de la cuenta cuando su acceso es bloqueado por
 * multiples contrasenas incorrectas (historia de abuso).
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

    public SuspiciousLoginNotifier(
            ObjectProvider<MailSender> mailSenders,
            @Value("${app.mail.enabled:false}") boolean mailEnabled) {
        this.mailSenders = mailSenders;
        this.mailEnabled = mailEnabled;
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
