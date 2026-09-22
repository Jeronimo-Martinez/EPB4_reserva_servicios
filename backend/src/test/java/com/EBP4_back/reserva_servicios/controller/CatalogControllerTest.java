package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class CatalogControllerTest {
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F\\-]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listsAllSeededServicesIncludingUnavailable() throws Exception {
        mockMvc.perform(get("/api/v1/catalog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total").exists())
                .andExpect(jsonPath("$.items[?(@.name=='Limpieza Facial Profunda')].available")
                        .value(false))
                .andExpect(jsonPath("$.items[?(@.name=='Corte de Cabello Clasico')].businessName")
                        .value("Centro Vital"))
                .andExpect(jsonPath("$.items[0].currency").value("COP"))
                .andExpect(jsonPath("$.items[0].averageRating").exists())
                .andExpect(jsonPath("$.items[0].reviewCount").value(0));
    }

    @Test
    void filtersByCategoryCaseInsensitive() throws Exception {
        mockMvc.perform(get("/api/v1/catalog").param("category", "belleza"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appliedCategory").value("belleza"))
                .andExpect(jsonPath("$.items[?(@.name=='Corte de Cabello Clasico')]").exists())
                .andExpect(jsonPath("$.items[?(@.name=='Masaje Descontracturante')]").doesNotExist());
    }

    @Test
    void searchesByServiceNameAndByBusinessName() throws Exception {
        mockMvc.perform(get("/api/v1/catalog").param("search", "masaje"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appliedSearch").value("masaje"))
                .andExpect(jsonPath("$.items[0].name").value("Masaje Descontracturante"));

        mockMvc.perform(get("/api/v1/catalog").param("search", "centro vital"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)));
    }

    @Test
    void combinesSearchAndCategoryFilters() throws Exception {
        mockMvc.perform(get("/api/v1/catalog")
                        .param("search", "corte")
                        .param("category", "Belleza"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.name=='Corte de Cabello Clasico')]").exists())
                .andExpect(jsonPath("$.items[?(@.name=='Masaje Descontracturante')]").doesNotExist());
    }

    @Test
    void returnsEmptyListWhenNoMatches() throws Exception {
        mockMvc.perform(get("/api/v1/catalog").param("search", "servicio-inexistente-xyz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void ignoresBlankSearchAndCategoryAsIfNotProvided() throws Exception {
        mockMvc.perform(get("/api/v1/catalog").param("search", "   ").param("category", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appliedSearch").doesNotExist())
                .andExpect(jsonPath("$.appliedCategory").doesNotExist())
                .andExpect(jsonPath("$.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)));
    }

    @Test
    void returnsDetailWithBusinessNameAndCurrency() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/catalog"))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        Matcher matcher = ID_PATTERN.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No hay ids en el catalogo: " + body);
        }
        String id = matcher.group(1);

        mockMvc.perform(get("/api/v1/catalog/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.businessName").exists())
                .andExpect(jsonPath("$.currency").value("COP"))
                .andExpect(jsonPath("$.durationMinutes").exists())
                .andExpect(jsonPath("$.price").exists());
    }

    @Test
    void returnsNotFoundForUnknownServiceId() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    void categoriesEndpointReturnsCatalog() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").exists())
                .andExpect(jsonPath("$[0].label").exists());
    }
}
