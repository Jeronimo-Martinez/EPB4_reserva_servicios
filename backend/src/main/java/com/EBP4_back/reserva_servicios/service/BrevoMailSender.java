package com.EBP4_back.reserva_servicios.service;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.mail.MailSendException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Sends mail through Brevo's HTTPS API. Render's free plan blocks the SMTP ports Gmail needs,
 * so this replaces SMTP whenever BREVO_API_KEY is set; without it, Spring's SMTP sender is used.
 */
@Component
@Primary
@ConditionalOnExpression("!'${app.mail.brevo-api-key:}'.isBlank()")
public class BrevoMailSender implements MailSender {
    private final RestClient client;
    private final Map<String, String> sender;

    public BrevoMailSender(@Value("${app.mail.brevo-api-key}") String apiKey,
            @Value("${app.mail.from:}") String from,
            @Value("${app.mail.from-name:ProMarket}") String fromName,
            @Value("${app.mail.brevo-url:https://api.brevo.com/v3/smtp/email}") String url) {
        if (from.isBlank()) {
            throw new IllegalStateException("Configura MAIL_FROM con un remitente verificado en Brevo");
        }
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory();
        // A stuck mail API must not hang a registration request.
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.client = RestClient.builder().baseUrl(url).requestFactory(requestFactory)
                .defaultHeader("api-key", apiKey).build();
        this.sender = Map.of("name", fromName, "email", from);
    }

    @Override
    public void send(SimpleMailMessage message) {
        List<Map<String, String>> to = Arrays.stream(message.getTo()).map(email -> Map.of("email", email)).toList();
        Map<String, Object> body = Map.of("sender", sender, "to", to,
                "subject", message.getSubject(), "textContent", message.getText());
        try {
            client.post().contentType(MediaType.APPLICATION_JSON).body(body).retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            // MailSendException keeps the callers' existing MailException handling working.
            throw new MailSendException("Brevo no pudo enviar el correo: " + exception.getMessage(), exception);
        }
    }

    @Override
    public void send(SimpleMailMessage... messages) {
        for (SimpleMailMessage message : messages) {
            send(message);
        }
    }
}
