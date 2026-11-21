package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-05: actualizacion de perfil. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ProfileControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private SessionService sessions;

    @Test
    void showsAndUpdatesTheAllowedFields() throws Exception {
        User user = newClient();
        String token = "Bearer " + sessions.open(user);

        mockMvc.perform(get("/api/v1/profile").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Maria"))
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.phone").value("+573104586721"))
                .andExpect(jsonPath("$.verified").value(true));

        // Escenario 3: email and role are not editable; sending them changes nothing.
        update(token, "{\"firstName\":\" Maria Jose \",\"lastName\":\"Gonzalez\",\"phone\":\"+57 311 000 1122\","
                + "\"email\":\"otro@example.com\",\"role\":\"PROVEEDOR\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Perfil actualizado correctamente"))
                .andExpect(jsonPath("$.firstName").value("Maria Jose"))
                .andExpect(jsonPath("$.phone").value("+57 311 000 1122"))
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.role").value("CLIENTE"));
        mockMvc.perform(get("/api/v1/profile").header("Authorization", token))
                .andExpect(jsonPath("$.lastName").value("Gonzalez"));
    }

    @Test
    void rejectsInvalidDataAndKeepsThePreviousProfile() throws Exception {
        String token = "Bearer " + sessions.open(newClient());

        update(token, "{\"firstName\":\"Maria\",\"phone\":\"telefono\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El telefono no tiene un formato valido"));
        update(token, "{\"firstName\":\" \",\"phone\":\"+573104586721\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El nombre es obligatorio"));
        mockMvc.perform(get("/api/v1/profile").header("Authorization", token))
                .andExpect(jsonPath("$.firstName").value("Maria"))
                .andExpect(jsonPath("$.phone").value("+573104586721"));

        mockMvc.perform(get("/api/v1/profile")).andExpect(status().isUnauthorized());
    }

    private ResultActions update(String token, String body) throws Exception {
        return mockMvc.perform(put("/api/v1/profile").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private User newClient() {
        User user = new User("Maria", "Gonzalez", "perfil." + System.nanoTime() + "@example.com", "+573104586721",
                "hash", UserRole.CLIENTE, true);
        user.verify();
        return users.save(user);
    }
}
