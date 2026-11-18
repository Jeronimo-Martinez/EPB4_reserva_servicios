package com.EBP4_back.reserva_servicios.controller;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.BusinessHours;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
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
class CatalogControllerTest {
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F\\-]+)\"");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private SessionService sessions;
    @Autowired
    private BusinessRepository businesses;
    @Autowired
    private ServiceOfferingRepository services;

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

    @Test
    void categoryStatsReturnsRealCountsPerCategory() throws Exception {
        Business business = newBusiness(true);
        services.save(new ServiceOffering(business, "Tratamiento Stats", "Salud y Bienestar", "Desc", 60,
                new BigDecimal("50000.00"), true));
        services.save(new ServiceOffering(business, "Corte Stats", "Belleza", "Desc", 45,
                new BigDecimal("30000.00"), true));
        services.save(new ServiceOffering(business, "Pausado Stats", "Belleza", "Desc", 30,
                new BigDecimal("20000.00"), false));

        mockMvc.perform(get("/api/v1/catalog/category-stats"))
                .andExpect(status().isOk())
                // All 7 enum categories are always present.
                .andExpect(jsonPath("$.length()").value(7))
                .andExpect(jsonPath("$[0].code").value("SALUD_Y_BIENESTAR"))
                .andExpect(jsonPath("$[0].label").value("Salud y Bienestar"))
                .andExpect(jsonPath("$[1].code").value("BELLEZA"))
                .andExpect(jsonPath("$[1].label").value("Belleza"))
                // Seeded data: 1 active Masaje Descontracturante (Salud y Bienestar)
                // + 1 new Tratamiento Stats = 2; Corte de Cabello Clasico + Corte Stats = 2 active Belleza;
                // Limpieza Facial Profunda is inactive so not counted.
                .andExpect(jsonPath("$[0].serviceCount").value(2))
                .andExpect(jsonPath("$[1].serviceCount").value(2))
                .andExpect(jsonPath("$[6].code").value("OTROS"))
                .andExpect(jsonPath("$[6].serviceCount").value(0));
    }

    @Test
    void businessDetailShowsContactInfoAndServicesWithBookableFlag() throws Exception {
        Business business = newBusiness(true);
        services.save(service(business, "Corte Activo", true));
        services.save(service(business, "Corte Pausado", false));

        mockMvc.perform(get("/api/v1/catalog/businesses/" + business.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Negocio Catalogo"))
                .andExpect(jsonPath("$.category").value("Belleza"))
                .andExpect(jsonPath("$.address").value("Calle 93 #14-28"))
                .andExpect(jsonPath("$.phone").value("+576017652890"))
                .andExpect(jsonPath("$.email").value(business.getUser().getEmail()))
                .andExpect(jsonPath("$.reviewCount").value(0))
                .andExpect(jsonPath("$.services.length()").value(2))
                .andExpect(jsonPath("$.services[?(@.name=='Corte Activo')].available").value(true))
                .andExpect(jsonPath("$.services[?(@.name=='Corte Pausado')].available").value(false));

        mockMvc.perform(get("/api/v1/catalog/businesses/00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    void searchesBusinessesByServiceNameBusinessNameOrNothing() throws Exception {
        Business business = newBusiness(true);
        String uniqueService = "Servicio Unico " + System.nanoTime();
        services.save(service(business, uniqueService, true));

        mockMvc.perform(get("/api/v1/catalog/businesses").param("search", uniqueService.toLowerCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(business.getId().toString()))
                .andExpect(jsonPath("$[0].services[0].name").value(uniqueService));
        mockMvc.perform(get("/api/v1/catalog/businesses").param("search", "centro vital"))
                .andExpect(jsonPath("$[?(@.name=='Centro Vital')]").exists());
        mockMvc.perform(get("/api/v1/catalog/businesses").param("search", "  "))
                .andExpect(jsonPath("$[?(@.name=='Centro Vital')]").exists())
                .andExpect(jsonPath("$[?(@.id=='" + business.getId() + "')]").exists());
        mockMvc.perform(get("/api/v1/catalog/businesses").param("search", "negocio-inexistente-xyz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void serviceWithoutBusinessHoursIsNotBookable() throws Exception {
        ServiceOffering service = services.save(service(newBusiness(false), "Sin Agenda", true));

        mockMvc.perform(get("/api/v1/catalog/" + service.getId()))
                .andExpect(jsonPath("$.available").value(false));
        mockMvc.perform(get("/api/v1/catalog/" + service.getId() + "/availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days.length()").value(0))
                .andExpect(jsonPath("$.message").value("El servicio no tiene disponibilidad proxima"));
    }

    @Test
    void availabilityRespectsHoursDurationAndTakenSlots() throws Exception {
        ServiceOffering service = services.save(service(newBusiness(true), "Masaje 60", true));
        LocalDate monday = LocalDate.now(Business.ZONE).with(TemporalAdjusters.next(DayOfWeek.MONDAY)).plusWeeks(2);
        // 60 min inside 09:00-12:00 every 30 min gives 09:00..11:00; a hold at 10:00 removes 09:30, 10:00 and 10:30.
        mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(newClient()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceId\":\"%s\",\"startAt\":\"%s\"}".formatted(service.getId(), at(monday, 10, 0))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/catalog/" + service.getId() + "/availability")
                        .param("from", monday.toString()).param("to", monday.plusDays(6).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.timeZone").value("America/Bogota"))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.days.length()").value(1))
                .andExpect(jsonPath("$.days[0].date").value(monday.toString()))
                .andExpect(jsonPath("$.days[0].slots").value(contains(at(monday, 9, 0), at(monday, 11, 0))));

        mockMvc.perform(get("/api/v1/catalog/" + service.getId() + "/availability")
                        .param("from", monday.toString()).param("to", monday.minusDays(1).toString()))
                .andExpect(status().isBadRequest());
    }

    private String at(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute).atZone(Business.ZONE).toInstant().toString();
    }

    private ServiceOffering service(Business business, String name, boolean available) {
        return new ServiceOffering(business, name, "Belleza", "Descripcion", 60, new BigDecimal("45000.00"), available);
    }

    // Only Mondays 09:00-12:00 when withHours, otherwise no schedule configured.
    private Business newBusiness(boolean withHours) {
        User user = new User("Proveedor", "Catalogo", "catalogo." + System.nanoTime() + "@example.com",
                "+576017652890", "hash", UserRole.PROVEEDOR, true);
        user.verify();
        Business business = new Business(users.save(user), "Negocio Catalogo", "Belleza", "Descripcion",
                "Calle 93 #14-28");
        if (withHours) {
            business.replaceHours(List.of(new BusinessHours(DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(12, 0))));
        }
        return businesses.save(business);
    }

    private String newClient() {
        User user = new User("Cliente", "Catalogo", "cat.cliente." + System.nanoTime() + "@example.com",
                "+573009998877", "hash", UserRole.CLIENTE, true);
        user.verify();
        return users.save(user).getEmail();
    }

    private String bearer(String email) {
        return "Bearer " + sessions.open(users.findByEmailIgnoreCase(email).orElseThrow());
    }
}
