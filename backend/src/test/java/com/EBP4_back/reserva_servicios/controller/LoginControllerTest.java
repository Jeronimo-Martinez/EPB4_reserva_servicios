package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class LoginControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void logsInAndIdentifiesClientAccount() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"cliente.demo@example.com","password":"Cliente123","recaptchaToken":"test-token"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Inicio de sesion exitoso"))
                .andExpect(jsonPath("$.email").value("cliente.demo@example.com"))
                .andExpect(jsonPath("$.role").value("CLIENTE"))
                .andExpect(jsonPath("$.redirectTo").value("/cliente"))
                .andExpect(jsonPath("$.firstName").value("Cliente"))
                .andExpect(jsonPath("$.lastName").value("Demo"))
                .andExpect(jsonPath("$.businessName").doesNotExist())
                .andExpect(jsonPath("$.businessCategory").doesNotExist());
    }

    @Test
    void logsInProviderAndReturnsBusinessData() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"centro.vital@example.com","password":"Proveedor123","recaptchaToken":"test-token"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PROVEEDOR"))
                .andExpect(jsonPath("$.redirectTo").value("/proveedor"))
                .andExpect(jsonPath("$.firstName").value("Jeronimo"))
                .andExpect(jsonPath("$.lastName").value("Martinez"))
                .andExpect(jsonPath("$.businessName").value("Centro Vital"))
                .andExpect(jsonPath("$.businessCategory").value("Salud y Bienestar"));
    }

    @Test
    void rejectsIncorrectPassword() throws Exception {
        performLogin("cliente.demo@example.com", "Incorrecta123")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Correo electronico o contrasena incorrectos"));
    }

    @Test
    void rejectsUnregisteredEmail() throws Exception {
        performLogin("no-existe@example.com", "Cliente123")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Correo electronico o contrasena incorrectos"));
    }

    @Test
    void rejectsEmptyEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\",\"password\":\"Cliente123\",\"recaptchaToken\":\"test-token\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsEmptyPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"cliente.demo@example.com\",\"password\":\"\",\"recaptchaToken\":\"test-token\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMissingCaptcha() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"cliente.demo@example.com\",\"password\":\"Cliente123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void blocksAccountAfterFiveFailedAttempts() throws Exception {
        String email = "bloqueo." + System.nanoTime() + "@example.com";
        for (int i = 0; i < 5; i++) {
            performLogin(email, "Incorrecta123")
                    .andExpect(status().isUnauthorized());
        }
        performLogin(email, "Incorrecta123")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(
                        "Demasiados intentos fallidos. Tu acceso fue bloqueado temporalmente. Intenta de nuevo mas tarde"));
    }

    @Test
    void otherAccountUnaffectedAfterBlock() throws Exception {
        String email = "otracuenta." + System.nanoTime() + "@example.com";
        for (int i = 0; i < 6; i++) {
            performLogin(email, "Incorrecta123");
        }
        // Otra cuenta sigue entrando con credenciales correctas
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"cliente.demo@example.com","password":"Cliente123","recaptchaToken":"test-token"}
                                """))
                .andExpect(status().isOk());
    }

    private org.springframework.test.web.servlet.ResultActions performLogin(String email, String password)
            throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"recaptchaToken\":\"test-token\"}"));
    }
}