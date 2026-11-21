package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import com.EBP4_back.reserva_servicios.repository.VerificationCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class RegistrationControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VerificationCodeRepository codes;

    @Test
    void registersAndVerifiesClient() throws Exception {
        String email = "cliente." + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/v1/registrations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Ana","lastName":"Gomez","email":"%s","phone":"+573001234567","password":"Cliente123","termsAccepted":true,"recaptchaToken":"test-token"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationRequired").value(true));

        String code = codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow().getCode();
        mockMvc.perform(post("/api/v1/registrations/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + "\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CLIENTE"))
                .andExpect(jsonPath("$.firstName").value("Ana"))
                .andExpect(jsonPath("$.lastName").value("Gomez"))
                .andExpect(jsonPath("$.businessName").doesNotExist())
                .andExpect(jsonPath("$.businessCategory").doesNotExist());
    }

    @Test
    void rejectsWeakPasswordAndUnacceptedTerms() throws Exception {
        String base = "{" + "\"firstName\":\"Ana\",\"lastName\":\"Gomez\",\"email\":\"%s\",\"phone\":\"+573001234567\",\"password\":\"%s\",\"termsAccepted\":%s,\"recaptchaToken\":\"test-token\"}";
        mockMvc.perform(post("/api/v1/registrations").contentType(MediaType.APPLICATION_JSON)
                        .content(base.formatted("weak." + System.nanoTime() + "@example.com", "weak", "true")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/registrations").contentType(MediaType.APPLICATION_JSON)
                        .content(base.formatted("terms." + System.nanoTime() + "@example.com", "Cliente123", "false")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registeringAgainReplacesAnUnverifiedAccountButNotAVerifiedOne() throws Exception {
        String email = "otra.vez." + System.nanoTime() + "@example.com";
        register(email, "Ana", "Cliente123").andExpect(status().isCreated());
        // The first code never arrived: the person registers again with other data.
        register(email, "Bea", "Distinta123").andExpect(status().isCreated());

        verify(email, latestCode(email)).andExpect(status().isOk()).andExpect(jsonPath("$.firstName").value("Bea"));
        login(email, "Cliente123").andExpect(status().isUnauthorized());
        login(email, "Distinta123").andExpect(status().isOk());
        register(email, "Eva", "Otra12345").andExpect(status().isConflict());
    }

    @Test
    void limitsWrongGuessesAndCodeRequests() throws Exception {
        String email = "limites." + System.nanoTime() + "@example.com";
        register(email, "Ana", "Cliente123").andExpect(status().isCreated());
        String code = latestCode(email);
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int attempt = 1; attempt < 5; attempt++) {
            verify(email, wrong).andExpect(status().isBadRequest());
        }
        verify(email, wrong).andExpect(status().isTooManyRequests());
        verify(email, code).andExpect(status().isBadRequest());

        // The registration sent 1 code; 3 more fit in the hour.
        for (int resend = 1; resend <= 3; resend++) {
            resend(email).andExpect(status().isOk());
        }
        resend(email).andExpect(status().isTooManyRequests());
        verify(email, latestCode(email)).andExpect(status().isOk());
    }

    private ResultActions register(String email, String firstName, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/registrations").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"%s","lastName":"Gomez","email":"%s","phone":"+573001234567","password":"%s","termsAccepted":true,"recaptchaToken":"test-token"}
                        """.formatted(firstName, email, password)));
    }

    private ResultActions verify(String email, String code) throws Exception {
        return mockMvc.perform(post("/api/v1/registrations/verify").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"code\":\"%s\"}".formatted(email, code)));
    }

    private ResultActions resend(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/registrations/resend-code").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\"}".formatted(email)));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\",\"recaptchaToken\":\"x\"}".formatted(email, password)));
    }

    private String latestCode(String email) {
        return codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email).orElseThrow().getCode();
    }
}