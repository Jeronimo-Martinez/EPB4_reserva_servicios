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
                                {"firstName":"Ana","lastName":"Gomez","email":"%s","phone":"+573001234567","password":"Cliente123","termsAccepted":true}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationRequired").value(true));

        String code = codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow().getCode();
        mockMvc.perform(post("/api/v1/registrations/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{" + "\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CLIENTE"));
    }

    @Test
    void rejectsWeakPasswordAndUnacceptedTerms() throws Exception {
        String base = "{" + "\"firstName\":\"Ana\",\"lastName\":\"Gomez\",\"email\":\"%s\",\"phone\":\"+573001234567\",\"password\":\"%s\",\"termsAccepted\":%s}";
        mockMvc.perform(post("/api/v1/registrations").contentType(MediaType.APPLICATION_JSON)
                        .content(base.formatted("weak." + System.nanoTime() + "@example.com", "weak", "true")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/registrations").contentType(MediaType.APPLICATION_JSON)
                        .content(base.formatted("terms." + System.nanoTime() + "@example.com", "Cliente123", "false")))
                .andExpect(status().isBadRequest());
    }
}