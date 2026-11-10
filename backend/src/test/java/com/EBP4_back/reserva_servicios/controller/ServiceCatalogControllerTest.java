package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ServiceCatalogControllerTest {
    private static final String PROVIDER_EMAIL = "centro.vital@example.com";
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F\\-]+)\"");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private SessionService sessions;

    @Test
    void createsServiceAndAppearsInProviderList() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/services").header("Authorization", bearer(PROVIDER_EMAIL)).contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody("Servicio Test", 30, "45000.00", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Servicio Test"))
                .andExpect(jsonPath("$.available").value(true))
                .andReturn();
        String id = extractId(created);

        mockMvc.perform(get("/api/v1/services").header("Authorization", bearer(PROVIDER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + id + "')].name").value("Servicio Test"));
    }

    @Test
    void rejectsEmptyNameInvalidDurationAndPrice() throws Exception {
        mockMvc.perform(post("/api/v1/services").header("Authorization", bearer(PROVIDER_EMAIL)).contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody("", 30, "45000.00", true)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/services").header("Authorization", bearer(PROVIDER_EMAIL)).contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody("Zero Duration", 0, "45000.00", true)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/services").header("Authorization", bearer(PROVIDER_EMAIL)).contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody("Zero Price", 30, "0.00", true)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updatesServiceAndTogglesAvailability() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/v1/services").header("Authorization", bearer(PROVIDER_EMAIL)).contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody("Antes", 30, "20000.00", true)))
                .andExpect(status().isCreated())
                .andReturn();
        String id = extractId(created);

        mockMvc.perform(put("/api/v1/services/" + id).header("Authorization", bearer(PROVIDER_EMAIL)).contentType(MediaType.APPLICATION_JSON)
                        .content(serviceBody("Despues", 45, "25000.00", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Despues"))
                .andExpect(jsonPath("$.durationMinutes").value(45));

        mockMvc.perform(patch("/api/v1/services/" + id + "/availability").header("Authorization", bearer(PROVIDER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"available\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    void listsCategoriesAndEmptyProviderList() throws Exception {
        mockMvc.perform(get("/api/v1/services/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").exists())
                .andExpect(jsonPath("$[0].label").exists());

        User withoutServices = new User("Sin", "Servicios", "sin.servicios." + System.nanoTime() + "@example.com",
                "+573001112233", "hash", UserRole.PROVEEDOR, true);
        mockMvc.perform(get("/api/v1/services").header("Authorization", bearer(users.save(withoutServices).getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private String extractId(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        Matcher matcher = ID_PATTERN.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No se encontro id en la respuesta: " + body);
        }
        return matcher.group(1);
    }

    private String serviceBody(String name, int duration, String price, boolean available) {
        return """
                {"name":"%s","category":"Belleza",
                "description":"Descripcion","durationMinutes":%d,"price":%s,"available":%s}
                """.formatted(name, duration, price, available);
    }

    private String bearer(String email) {
        return "Bearer " + sessions.open(users.findByEmailIgnoreCase(email).orElseThrow());
    }
}
