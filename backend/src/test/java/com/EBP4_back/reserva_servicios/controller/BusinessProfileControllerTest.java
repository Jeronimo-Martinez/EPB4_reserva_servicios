package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
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

/** HU-06 Actualizacion de perfil (Negocios). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class BusinessProfileControllerTest {
    private static final String URL = "/api/v1/business/profile";
    private static final String VALID = """
            {"name":"Spa Renacer","category":"Belleza","description":"Masajes, faciales y cuidado integral de la piel.",
             "address":"Calle 10 # 20-30, Medellin","phone":"+57 300 555 1234"}
            """;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private BusinessRepository businesses;
    @Autowired
    private SessionService sessions;

    @Test
    void showsCurrentInformationOfTheOwnBusiness() throws Exception {
        Business business = newBusiness();
        mockMvc.perform(get(URL).header("Authorization", bearer(business.getUser())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.businessId").value(business.getId().toString()))
                .andExpect(jsonPath("$.name").value("Centro Original"))
                .andExpect(jsonPath("$.category").value("Salud y Bienestar"))
                .andExpect(jsonPath("$.description").value("Descripcion original"))
                .andExpect(jsonPath("$.address").value("Calle 1"))
                .andExpect(jsonPath("$.phone").value("+573001112233"))
                .andExpect(jsonPath("$.email").value(business.getUser().getEmail()));
    }

    @Test
    void savesChangesAndClientsSeeThemImmediately() throws Exception {
        Business business = newBusiness();
        update(business.getUser(), VALID)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Perfil del negocio actualizado correctamente"))
                .andExpect(jsonPath("$.name").value("Spa Renacer"))
                .andExpect(jsonPath("$.category").value("Belleza"))
                .andExpect(jsonPath("$.phone").value("+57 300 555 1234"));

        // Lo que consultan los clientes (catalogo publico, sin sesion) ya muestra los datos nuevos.
        mockMvc.perform(get("/api/v1/catalog/businesses/" + business.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Spa Renacer"))
                .andExpect(jsonPath("$.category").value("Belleza"))
                .andExpect(jsonPath("$.description").value("Masajes, faciales y cuidado integral de la piel."))
                .andExpect(jsonPath("$.address").value("Calle 10 # 20-30, Medellin"))
                .andExpect(jsonPath("$.phone").value("+57 300 555 1234"));
    }

    @Test
    void acceptsTheCategoryKeyUsedByTheRegistrationAndStoresItsLabel() throws Exception {
        Business business = newBusiness();
        update(business.getUser(), VALID.replace("\"Belleza\"", "\"GASTRONOMIA\""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Gastronomia"));
    }

    @Test
    void rejectsInvalidDataAndKeepsThePreviousInformation() throws Exception {
        Business business = newBusiness();
        User owner = business.getUser();
        update(owner, VALID.replace("\"Spa Renacer\"", "\"\""))
                .andExpect(status().isBadRequest());
        update(owner, VALID.replace("\"+57 300 555 1234\"", "\"telefono-malo\""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El telefono no tiene un formato valido"));
        update(owner, VALID.replace("\"Belleza\"", "\"Mecanica espacial\""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La categoria no es valida"));
        update(owner, VALID.replace("Masajes, faciales y cuidado integral de la piel.", "x".repeat(301)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get(URL).header("Authorization", bearer(owner)))
                .andExpect(jsonPath("$.name").value("Centro Original"))
                .andExpect(jsonPath("$.category").value("Salud y Bienestar"))
                .andExpect(jsonPath("$.description").value("Descripcion original"))
                .andExpect(jsonPath("$.phone").value("+573001112233"));
    }

    @Test
    void restrictedEmailCannotBeChanged() throws Exception {
        Business business = newBusiness();
        String email = business.getUser().getEmail();
        update(business.getUser(), VALID.replace("{", "{\"email\":\"intruso@example.com\","))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
        mockMvc.perform(get(URL).header("Authorization", bearer(business.getUser())))
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void onlyProvidersReachTheBusinessProfile() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(URL).header("Authorization", bearer(newUser(UserRole.CLIENTE))))
                .andExpect(status().isForbidden());
    }

    private ResultActions update(User owner, String json) throws Exception {
        return mockMvc.perform(put(URL).header("Authorization", bearer(owner))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Business newBusiness() {
        return businesses.save(new Business(newUser(UserRole.PROVEEDOR), "Centro Original", "Salud y Bienestar",
                "Descripcion original", "Calle 1"));
    }

    private User newUser(UserRole role) {
        User user = new User("Usuario", "Prueba", role.name().toLowerCase() + "." + System.nanoTime() + "@example.com",
                "+573001112233", "hash", role, true);
        user.verify();
        return users.save(user);
    }

    private String bearer(User user) {
        return "Bearer " + sessions.open(user);
    }
}
