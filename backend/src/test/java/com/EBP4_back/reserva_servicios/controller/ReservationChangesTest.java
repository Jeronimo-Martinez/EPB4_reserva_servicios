package com.EBP4_back.reserva_servicios.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** HU-10 (bloqueos), HU-19 (reprogramacion) and HU-20 (cancelacion por el proveedor). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@ExtendWith(OutputCaptureExtension.class)
class ReservationChangesTest {
    private static final Pattern ID = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F\\-]+)\"");

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
    private PlatformTransactionManager transactionManager;
    @PersistenceContext
    private EntityManager entityManager;

    private final LocalDate monday = LocalDate.now(Business.ZONE).with(TemporalAdjusters.next(DayOfWeek.MONDAY)).plusWeeks(6);

    // ---------- HU-10

    @Test
    void blockedHoursAndDaysDisappearFromAvailabilityAndCannotBeBooked() throws Exception {
        User provider = newUser(UserRole.PROVEEDOR);
        ServiceOffering service = newService(newBusiness(provider));

        block(provider, monday, monday, "\"13:00\"", "\"16:00\"", "Asunto personal", false)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reason").value("Asunto personal"));
        availability(service, monday, monday.plusDays(2))
                .andExpect(jsonPath("$.days[0].slots", hasItem(at(monday, 9).toString())))
                .andExpect(jsonPath("$.days[0].slots", hasItem(at(monday, 16).toString())))
                .andExpect(jsonPath("$.days[0].slots", not(hasItem(at(monday, 14).toString()))))
                .andExpect(jsonPath("$.days[0].slots", not(hasItem(at(monday, 12).plusSeconds(1800).toString()))));
        hold(newUser(UserRole.CLIENTE), service, at(monday, 14)).andExpect(status().isConflict());
        agenda(provider)
                .andExpect(jsonPath("$.days[0].blocks[0].startAt").value(at(monday, 13).toString()))
                .andExpect(jsonPath("$.days[0].blocks[0].endAt").value(at(monday, 16).toString()));

        // Escenario 5: the same period cannot be blocked twice.
        block(provider, monday, monday, "\"14:00\"", "\"15:00\"", null, false)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El periodo seleccionado ya está bloqueado"));

        // Escenario 1: whole days (no times) remove those dates from the availability.
        block(provider, monday.plusDays(1), monday.plusDays(2), "null", "null", null, false).andExpect(status().isCreated());
        availability(service, monday, monday.plusDays(2))
                .andExpect(jsonPath("$.days.length()").value(1))
                .andExpect(jsonPath("$.days[0].date").value(monday.toString()));
        agenda(provider).andExpect(jsonPath("$.days[1].blocks[0].startAt").value(at(monday.plusDays(1), 8).toString()));

        block(provider, monday, monday, "\"10:00\"", null, null, false).andExpect(status().isBadRequest());
    }

    @Test
    void blockOverAReservationWaitsForTheProviderToConfirmTheWarning() throws Exception {
        User provider = newUser(UserRole.PROVEEDOR);
        ServiceOffering service = newService(newBusiness(provider));
        User client = newUser(UserRole.CLIENTE);
        String id = reserve(client, service, at(monday, 10));

        block(provider, monday, monday, "\"09:00\"", "\"12:00\"", null, false)
                .andExpect(status().isPreconditionRequired())
                .andExpect(jsonPath("$.message", containsString("afecta 1 reserva programada: Usuario Prueba")));
        agenda(provider).andExpect(jsonPath("$.days[0].blocks.length()").value(0));

        block(provider, monday, monday, "\"09:00\"", "\"12:00\"", null, true).andExpect(status().isCreated());
        mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", bearer(client)))
                .andExpect(jsonPath("$.status").value("CONFIRMADA"));
    }

    // ---------- HU-19

    @Test
    void clientReschedulesAnActiveReservation(CapturedOutput output) throws Exception {
        User provider = newUser(UserRole.PROVEEDOR);
        ServiceOffering service = newService(newBusiness(provider));
        User client = newUser(UserRole.CLIENTE);
        String id = reserve(client, service, at(monday, 9));
        reserve(newUser(UserRole.CLIENTE), service, at(monday, 13));
        block(provider, monday, monday, "\"15:00\"", "\"17:00\"", null, false).andExpect(status().isCreated());

        reschedule(client, id, at(monday, 13)).andExpect(status().isConflict());
        reschedule(client, id, at(monday, 15)).andExpect(status().isConflict());
        reschedule(client, id, at(monday, 7)).andExpect(status().isBadRequest());
        reschedule(newUser(UserRole.CLIENTE), id, at(monday, 11)).andExpect(status().isForbidden());

        reschedule(client, id, at(monday, 11))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Reserva reprogramada exitosamente"))
                .andExpect(jsonPath("$.startAt").value(at(monday, 11).toString()))
                .andExpect(jsonPath("$.endAt").value(at(monday, 12).toString()));
        availability(service, monday, monday)
                .andExpect(jsonPath("$.days[0].slots", hasItem(at(monday, 9).toString())))
                .andExpect(jsonPath("$.days[0].slots", not(hasItem(at(monday, 11).toString()))));
        assertThat(output).contains("Horario anterior: " + "%02d/%02d/%d 09:00".formatted(
                monday.getDayOfMonth(), monday.getMonthValue(), monday.getYear()));
        assertThat(output).contains("Nuevo horario: " + "%02d/%02d/%d 11:00".formatted(
                monday.getDayOfMonth(), monday.getMonthValue(), monday.getYear()));
    }

    @Test
    void cancelledAndPastReservationsCannotBeRescheduled() throws Exception {
        User provider = newUser(UserRole.PROVEEDOR);
        ServiceOffering service = newService(newBusiness(provider));
        User client = newUser(UserRole.CLIENTE);
        String cancelled = reserve(client, service, at(monday, 9));
        cancel(provider, cancelled, "{}").andExpect(status().isOk());
        reschedule(client, cancelled, at(monday, 11))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No puedes reprogramar una reserva cancelada"));

        String past = reserve(client, service, at(monday, 10));
        moveToThePast(past);
        reschedule(client, past, at(monday, 11))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No puedes reprogramar una reserva que ya pasó"));
    }

    // ---------- HU-20

    @Test
    void providerCancelsAReservationNotifiesTheClientAndFreesTheSlot(CapturedOutput output) throws Exception {
        User provider = newUser(UserRole.PROVEEDOR);
        ServiceOffering service = newService(newBusiness(provider));
        User client = newUser(UserRole.CLIENTE);
        String id = reserve(client, service, at(monday, 15));

        User otherProvider = newUser(UserRole.PROVEEDOR);
        newBusiness(otherProvider);
        cancel(otherProvider, id, "{}").andExpect(status().isForbidden());
        cancel(provider, id, "{\"reason\":\"El profesional asignado no estara disponible\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADA"));

        assertThat(output).contains("Notificacion de reserva para " + client.getEmail());
        assertThat(output).contains("Motivo: El profesional asignado no estara disponible");
        mockMvc.perform(get("/api/v1/reservations").header("Authorization", bearer(client)))
                .andExpect(jsonPath("$[0].status").value("CANCELADA"))
                .andExpect(jsonPath("$[0].cancelledBy").value("PROVEEDOR"))
                .andExpect(jsonPath("$[0].cancellationReason").value("El profesional asignado no estara disponible"));
        agenda(provider).andExpect(jsonPath("$.days[0].reservations.length()").value(0));
        hold(newUser(UserRole.CLIENTE), service, at(monday, 15)).andExpect(status().isCreated());

        cancel(provider, id, "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("La reserva ya fue cancelada"));
        mockMvc.perform(post("/api/v1/reservations/" + id + "/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isConflict());

        // Escenario 2: without a reason; escenario 3: a reservation that already passed.
        String noReason = reserve(client, service, at(monday, 9));
        cancel(provider, noReason, "{}").andExpect(status().isOk());
        String past = reserve(client, service, at(monday, 11));
        moveToThePast(past);
        cancel(provider, past, "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No puedes cancelar una reserva que ya pasó"));
    }

    private ResultActions block(User provider, LocalDate from, LocalDate to, String startTime, String endTime,
            String reason, boolean confirm) throws Exception {
        return mockMvc.perform(post("/api/v1/schedule/blocks").header("Authorization", bearer(provider))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"startDate\":\"%s\",\"endDate\":\"%s\",\"startTime\":%s,\"endTime\":%s,\"reason\":%s,\"confirmConflicts\":%s}"
                        .formatted(from, to, startTime, endTime, reason == null ? "null" : "\"" + reason + "\"", confirm)));
    }

    private ResultActions availability(ServiceOffering service, LocalDate from, LocalDate to) throws Exception {
        return mockMvc.perform(get("/api/v1/catalog/" + service.getId() + "/availability")
                .param("from", from.toString()).param("to", to.toString()));
    }

    private ResultActions agenda(User provider) throws Exception {
        return mockMvc.perform(get("/api/v1/schedule/agenda").header("Authorization", bearer(provider))
                .param("view", "SEMANA").param("date", monday.toString()));
    }

    private ResultActions reschedule(User client, String id, Instant startAt) throws Exception {
        return mockMvc.perform(post("/api/v1/reservations/" + id + "/reschedule").header("Authorization", bearer(client))
                .contentType(MediaType.APPLICATION_JSON).content("{\"startAt\":\"%s\"}".formatted(startAt)));
    }

    private ResultActions cancel(User provider, String id, String body) throws Exception {
        return mockMvc.perform(post("/api/v1/schedule/reservations/" + id + "/cancel").header("Authorization", bearer(provider))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions hold(User client, ServiceOffering service, Instant startAt) throws Exception {
        return mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(client))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceId\":\"%s\",\"startAt\":\"%s\"}".formatted(service.getId(), startAt)));
    }

    private String reserve(User client, ServiceOffering service, Instant startAt) throws Exception {
        String body = hold(client, service, startAt).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Matcher matcher = ID.matcher(body);
        assertThat(matcher.find()).as("sin id: %s", body).isTrue();
        mockMvc.perform(post("/api/v1/reservations/" + matcher.group(1) + "/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isOk());
        return matcher.group(1);
    }

    private void moveToThePast(String id) {
        Instant past = Instant.now().minusSeconds(7200);
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> entityManager
                .createQuery("UPDATE Reservation r SET r.startAt = :start, r.endAt = :end WHERE r.id = :id")
                .setParameter("start", past).setParameter("end", past.plusSeconds(3600))
                .setParameter("id", UUID.fromString(id))
                .executeUpdate());
    }

    private Instant at(LocalDate date, int hour) {
        return date.atTime(hour, 0).atZone(Business.ZONE).toInstant();
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

    private Business newBusiness(User provider) {
        Business business = new Business(provider, "Negocio " + provider.getEmail(), "Belleza", "Descripcion", "Calle 1");
        business.replaceHours(Stream.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY)
                .map(day -> new BusinessHours(day, LocalTime.of(8, 0), LocalTime.of(18, 0))).toList());
        return businesses.save(business);
    }

    private ServiceOffering newService(Business business) {
        return services.save(new ServiceOffering(business, "Servicio Prueba", "Belleza", "Descripcion", 60,
                new BigDecimal("50000.00"), true));
    }
}
