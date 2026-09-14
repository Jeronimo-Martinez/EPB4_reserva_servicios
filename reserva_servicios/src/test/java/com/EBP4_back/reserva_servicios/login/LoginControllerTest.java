package com.EBP4_back.reserva_servicios.login;

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
                                {"email":"cliente.demo@example.com","password":"Cliente123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Inicio de sesion exitoso"))
                .andExpect(jsonPath("$.email").value("cliente.demo@example.com"))
                .andExpect(jsonPath("$.role").value("CLIENTE"))
                .andExpect(jsonPath("$.redirectTo").value("/cliente"));
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
                        .content("{\"email\":\"\",\"password\":\"Cliente123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsEmptyPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"cliente.demo@example.com\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.ResultActions performLogin(String email, String password)
            throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }
}