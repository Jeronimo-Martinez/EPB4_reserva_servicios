package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.VerificationCodeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ProviderRegistrationControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VerificationCodeRepository codes;

    @Autowired
    private BusinessRepository businesses;

    @Test
    void registersProviderCreatesBusinessAndVerifies() throws Exception {
        String email = "proveedor." + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/v1/registrations/provider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(providerBody(email, "Proveedor123", true, "Centro Test", "Salud y Bienestar")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificationRequired").value(true));

        String code = codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow().getCode();
        mockMvc.perform(post("/api/v1/registrations/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PROVEEDOR"));

        assert businesses.existsByUserEmailIgnoreCase(email);
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        String email = "dupe." + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/v1/registrations/provider").contentType(MediaType.APPLICATION_JSON)
                        .content(providerBody(email, "Proveedor123", true, "Centro Dup", "Belleza")))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/registrations/provider").contentType(MediaType.APPLICATION_JSON)
                        .content(providerBody(email, "Proveedor123", true, "Centro Dup 2", "Belleza")))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsWeakPasswordAndUnacceptedTerms() throws Exception {
        mockMvc.perform(post("/api/v1/registrations/provider").contentType(MediaType.APPLICATION_JSON)
                        .content(providerBody("weakp." + System.nanoTime() + "@example.com", "weak", true, "Centro W", "Belleza")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/registrations/provider").contentType(MediaType.APPLICATION_JSON)
                        .content(providerBody("terms." + System.nanoTime() + "@example.com", "Proveedor123", false, "Centro T", "Belleza")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsInvalidCodeAndResendsIt() throws Exception {
        String email = "resend." + System.nanoTime() + "@example.com";
        mockMvc.perform(post("/api/v1/registrations/provider").contentType(MediaType.APPLICATION_JSON)
                        .content(providerBody(email, "Proveedor123", true, "Centro Resend", "Salud y Bienestar")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/registrations/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/registrations/resend-code").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        String freshCode = codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow().getCode();
        mockMvc.perform(post("/api/v1/registrations/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + freshCode + "\"}"))
                .andExpect(status().isOk());
    }

    private String providerBody(String email, String password, boolean terms, String businessName, String category) {
        return """
                {"firstName":"Jero","lastName":"Martinez","email":"%s","phone":"+573001112233",
                "password":"%s","termsAccepted":%s,
                "businessName":"%s","businessCategory":"%s",
                "businessDescription":"Descripcion valida del negocio para pruebas.",
                "address":"Cra 43A #1-50, Medellin"}
                """.formatted(email, password, terms, businessName, category);
    }
}
