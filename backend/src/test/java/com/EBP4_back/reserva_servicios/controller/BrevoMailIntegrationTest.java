package com.EBP4_back.reserva_servicios.controller;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.repository.VerificationCodeRepository;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/** With BREVO_API_KEY set, verification codes leave through the Brevo API instead of SMTP. */
@SpringBootTest(properties = {"app.mail.enabled=true", "app.mail.brevo-api-key=xkeysib-test",
        "app.mail.from=remitente@example.com"})
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class BrevoMailIntegrationTest {
    private static final List<String> SENT = new CopyOnWriteArrayList<>();
    private static final HttpServer FAKE_BREVO = start();

    private static HttpServer start() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
            server.createContext("/v3/smtp/email", exchange -> {
                SENT.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
                exchange.sendResponseHeaders(201, -1);
                exchange.close();
            });
            server.start();
            return server;
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    @DynamicPropertySource
    static void brevoUrl(DynamicPropertyRegistry registry) {
        registry.add("app.mail.brevo-url", () -> "http://localhost:" + FAKE_BREVO.getAddress().getPort() + "/v3/smtp/email");
    }

    @AfterAll
    static void stop() {
        FAKE_BREVO.stop(0);
    }

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private VerificationCodeRepository codes;

    @Test
    void registrationSendsTheVerificationCodeThroughBrevo() throws Exception {
        String email = "brevo." + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/v1/registrations").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Ana","lastName":"Gomez","email":"%s","phone":"+573001234567",
                                "password":"Cliente123","termsAccepted":true,"recaptchaToken":"test-token"}
                                """.formatted(email)))
                .andExpect(status().isCreated());

        String code = codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email).orElseThrow().getCode();
        assertTrue(SENT.stream().anyMatch(json -> json.contains("\"email\":\"" + email + "\"") && json.contains(code)),
                "Brevo no recibio el codigo para " + email + ": " + SENT);
    }
}
