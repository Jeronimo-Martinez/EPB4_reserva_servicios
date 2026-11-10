package com.EBP4_back.reserva_servicios.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;

class BrevoMailSenderTest {
    private HttpServer server;
    private final AtomicReference<String> body = new AtomicReference<>();
    private final AtomicReference<String> apiKey = new AtomicReference<>();

    private String fakeBrevo(int status) throws Exception {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        server.createContext("/v3/smtp/email", exchange -> {
            apiKey.set(exchange.getRequestHeaders().getFirst("api-key"));
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{\"messageId\":\"<1@brevo>\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();
        return "http://localhost:" + server.getAddress().getPort() + "/v3/smtp/email";
    }

    @AfterEach
    void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    private SimpleMailMessage message() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("cliente@example.com");
        message.setSubject("Codigo de verificacion ProMarket");
        message.setText("Tu codigo es 123456");
        return message;
    }

    @Test
    void postsTheMessageInBrevoFormatWithTheApiKey() throws Exception {
        new BrevoMailSender("xkeysib-test", "remitente@example.com", "ProMarket", fakeBrevo(201)).send(message());

        assertEquals("xkeysib-test", apiKey.get());
        String json = body.get();
        assertTrue(json.contains("\"sender\":{") && json.contains("\"email\":\"remitente@example.com\"")
                && json.contains("\"name\":\"ProMarket\""), json);
        assertTrue(json.contains("\"to\":[{\"email\":\"cliente@example.com\"}]"), json);
        assertTrue(json.contains("\"subject\":\"Codigo de verificacion ProMarket\""), json);
        assertTrue(json.contains("\"textContent\":\"Tu codigo es 123456\""), json);
    }

    @Test
    void turnsAnApiErrorIntoMailSendException() throws Exception {
        BrevoMailSender sender = new BrevoMailSender("clave-invalida", "remitente@example.com", "ProMarket", fakeBrevo(401));

        assertThrows(MailSendException.class, () -> sender.send(message()));
    }

    @Test
    void refusesToStartWithoutASender() {
        assertThrows(IllegalStateException.class,
                () -> new BrevoMailSender("xkeysib-test", " ", "ProMarket", "http://localhost/v3/smtp/email"));
    }
}
