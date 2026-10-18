package com.EBP4_back.reserva_servicios.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import com.EBP4_back.reserva_servicios.security.AccessAuditService;
import com.EBP4_back.reserva_servicios.security.SessionService;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HA-29 (elevacion de privilegios / IDOR) and HUS-29 (privilegio minimo). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@ExtendWith(OutputCaptureExtension.class)
class AccessControlTest {
    private static final String PASSWORD = "Clave1234";
    private static final Pattern ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F\\-]+)\"");
    private static final Pattern TOKEN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private BusinessRepository businesses;
    @Autowired
    private ServiceOfferingRepository services;
    @Autowired
    private SessionService sessions;
    @Autowired
    private PasswordEncoder encoder;

    @Test
    void protectedFunctionsRequireASessionAndTheCatalogStaysPublic() throws Exception {
        mockMvc.perform(get("/api/v1/services")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Debes iniciar sesion para continuar"));
        mockMvc.perform(get("/api/v1/schedule/agenda")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/reservations/holds").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/reservations/" + UUID.randomUUID()).header("Authorization", "Bearer token-inventado"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/catalog")).andExpect(status().isOk());
    }

    @Test
    void eachRoleOnlyReachesItsOwnFunctions(CapturedOutput output) throws Exception {
        User client = newUser(UserRole.CLIENTE);
        User provider = newUser(UserRole.PROVEEDOR);

        mockMvc.perform(get("/api/v1/services").header("Authorization", bearer(client)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("No tienes permitido acceder a esta funcion"));
        mockMvc.perform(get("/api/v1/schedule/hours").header("Authorization", bearer(client))).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(provider))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());

        assertThat(output).contains("ACCESO_DENEGADO usuario=" + client.getEmail() + " accion=GET recurso=/api/v1/services");
        assertThat(output).contains("ACCESO_DENEGADO usuario=" + provider.getEmail() + " accion=POST");
    }

    @Test
    void clientCannotSeeNorEditAnotherClientsReservation(CapturedOutput output) throws Exception {
        ServiceOffering service = newService(newBusiness(newUser(UserRole.PROVEEDOR)));
        User owner = newUser(UserRole.CLIENTE);
        User intruder = newUser(UserRole.CLIENTE);
        String id = holdId(owner, service, 10);

        mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", bearer(intruder)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(AccessAuditService.NOT_ALLOWED_VIEW))
                .andExpect(jsonPath("$.serviceName").doesNotExist())
                .andExpect(jsonPath("$.startAt").doesNotExist());
        mockMvc.perform(post("/api/v1/reservations/" + id + "/confirm").header("Authorization", bearer(intruder)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(AccessAuditService.NOT_ALLOWED_EDIT));

        mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", bearer(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDIENTE"));
        assertThat(output).contains("ACCESO_DENEGADO usuario=" + intruder.getEmail() + " accion=VER_RESERVA recurso=reserva " + id);
        assertThat(output).contains("ACCESO_DENEGADO usuario=" + intruder.getEmail() + " accion=EDITAR_RESERVA recurso=reserva " + id);
    }

    @Test
    void providerOnlyManagesAndSeesItsOwnBusiness() throws Exception {
        User providerA = newUser(UserRole.PROVEEDOR);
        User providerB = newUser(UserRole.PROVEEDOR);
        ServiceOffering serviceA = newService(newBusiness(providerA));
        newBusiness(providerB);

        mockMvc.perform(put("/api/v1/services/" + serviceA.getId()).header("Authorization", bearer(providerB))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Robado\",\"category\":\"Belleza\",\"durationMinutes\":30,\"price\":1000}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(AccessAuditService.NOT_ALLOWED_EDIT));
        mockMvc.perform(patch("/api/v1/services/" + serviceA.getId() + "/availability").header("Authorization", bearer(providerB))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/services").header("Authorization", bearer(providerA)))
                .andExpect(jsonPath("$[0].name").value("Servicio Privado"))
                .andExpect(jsonPath("$[0].available").value(true));

        User client = newUser(UserRole.CLIENTE);
        String id = holdId(client, serviceA, 10);
        mockMvc.perform(post("/api/v1/reservations/" + id + "/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isOk());
        String monday = mondayIn(5).toString();
        mockMvc.perform(get("/api/v1/schedule/agenda").header("Authorization", bearer(providerA))
                        .param("view", "SEMANA").param("date", monday))
                .andExpect(jsonPath("$.days[0].reservations[0].id").value(id));
        mockMvc.perform(get("/api/v1/schedule/agenda").header("Authorization", bearer(providerB))
                        .param("view", "SEMANA").param("date", monday))
                .andExpect(jsonPath("$.message").value("No tienes reservas programadas en este periodo"));
    }

    @Test
    void repeatedDeniedAttemptsCloseTheSessionsAndBlockTheAccount() throws Exception {
        String id = holdId(newUser(UserRole.CLIENTE), newService(newBusiness(newUser(UserRole.PROVEEDOR))), 10);
        User intruder = newUser(UserRole.CLIENTE);
        String token = bearer(intruder);

        for (int attempt = 1; attempt < 5; attempt++) {
            mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", token))
                    .andExpect(jsonPath("$.message").value(AccessAuditService.NOT_ALLOWED_VIEW));
        }
        mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(AccessAuditService.ACCOUNT_BLOCKED));

        mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", token)).andExpect(status().isUnauthorized());
        login(intruder.getEmail(), PASSWORD)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(AccessAuditService.ACCOUNT_BLOCKED));
    }

    @Test
    void loginIssuesATokenAndLogoutRevokesIt() throws Exception {
        String body = login("centro.vital@example.com", "Proveedor123").andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Matcher matcher = TOKEN.matcher(body);
        assertThat(matcher.find()).as("login sin token: %s", body).isTrue();
        String token = "Bearer " + matcher.group(1);

        mockMvc.perform(get("/api/v1/services").header("Authorization", token)).andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/logout").header("Authorization", token)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/services").header("Authorization", token)).andExpect(status().isUnauthorized());
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\",\"recaptchaToken\":\"x\"}".formatted(email, password)));
    }

    private User newUser(UserRole role) {
        User user = new User("Usuario", "Prueba", role.name().toLowerCase() + "." + System.nanoTime() + "@example.com",
                "+573001112233", encoder.encode(PASSWORD), role, true);
        user.verify();
        return users.save(user);
    }

    private String bearer(User user) {
        return "Bearer " + sessions.open(user);
    }

    private Business newBusiness(User provider) {
        Business business = new Business(provider, "Negocio " + provider.getEmail(), "Belleza", "Descripcion", "Calle 1");
        business.replaceHours(Stream.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY)
                .map(day -> new BusinessHours(day, LocalTime.of(8, 0), LocalTime.of(18, 0))).toList());
        return businesses.save(business);
    }

    private ServiceOffering newService(Business business) {
        return services.save(new ServiceOffering(business, "Servicio Privado", "Belleza", "Descripcion", 60,
                new BigDecimal("50000.00"), true));
    }

    private LocalDate mondayIn(int weeks) {
        return LocalDate.now(Business.ZONE).with(TemporalAdjusters.next(DayOfWeek.MONDAY)).plusWeeks(weeks);
    }

    private String holdId(User client, ServiceOffering service, int hour) throws Exception {
        String startAt = mondayIn(5).atTime(hour, 0).atZone(Business.ZONE).toInstant().toString();
        String body = mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceId\":\"%s\",\"startAt\":\"%s\"}".formatted(service.getId(), startAt)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Matcher matcher = ID.matcher(body);
        assertThat(matcher.find()).as("sin id: %s", body).isTrue();
        return matcher.group(1);
    }
}
