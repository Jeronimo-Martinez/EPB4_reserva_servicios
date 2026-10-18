package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import com.EBP4_back.reserva_servicios.security.SessionService;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ScheduleControllerTest {
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
    void savesShowsAndUpdatesBusinessHours() throws Exception {
        String provider = newProvider(false).getUser().getEmail();
        hours(provider).andExpect(status().isOk()).andExpect(jsonPath("$.days.length()").value(0));

        saveHours(provider, """
                [{"dayOfWeek":"TUESDAY","startTime":"09:00","endTime":"17:00"},
                 {"dayOfWeek":"MONDAY","startTime":"08:00","endTime":"12:00"}]""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Horario guardado exitosamente"))
                .andExpect(jsonPath("$.timeZone").value("America/Bogota"))
                .andExpect(jsonPath("$.days[0].dayOfWeek").value("MONDAY"))
                .andExpect(jsonPath("$.days[1].dayOfWeek").value("TUESDAY"));

        saveHours(provider, "[{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"10:00\",\"endTime\":\"14:00\"}]")
                .andExpect(status().isOk());
        hours(provider)
                .andExpect(jsonPath("$.days.length()").value(1))
                .andExpect(jsonPath("$.days[0].startTime").value("10:00:00"))
                .andExpect(jsonPath("$.days[0].endTime").value("14:00:00"));
    }

    @Test
    void rejectsInvalidHoursWithoutSaving() throws Exception {
        String provider = newProvider(false).getUser().getEmail();

        saveHours(provider, "[{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"18:00\",\"endTime\":\"08:00\"}]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La hora de inicio debe ser anterior a la hora de cierre (lunes)"));
        saveHours(provider, "[]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Debe seleccionar al menos un dia de atencion"));
        saveHours(provider, "[{\"dayOfWeek\":\"MONDAY\",\"startTime\":\"08:00\"}]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Faltan datos de horario para uno o mas dias"));
        saveHours(provider, """
                [{"dayOfWeek":"MONDAY","startTime":"08:00","endTime":"12:00"},
                 {"dayOfWeek":"MONDAY","startTime":"14:00","endTime":"18:00"}]""")
                .andExpect(status().isBadRequest());

        hours(provider).andExpect(jsonPath("$.days.length()").value(0));
        User withoutBusiness = new User("Sin", "Negocio", "sin.negocio." + System.nanoTime() + "@example.com",
                "+573001112233", "hash", UserRole.PROVEEDOR, true);
        hours(users.save(withoutBusiness).getEmail()).andExpect(status().isNotFound());
    }

    @Test
    void agendaShowsReservationsByDayWeekAndMonth() throws Exception {
        Business business = newProvider(true);
        String provider = business.getUser().getEmail();
        ServiceOffering service = services.save(new ServiceOffering(business, "Masaje Agenda", "Salud y Bienestar",
                "Descripcion", 60, new BigDecimal("80000.00"), true));
        LocalDate wednesday = LocalDate.now(Business.ZONE).with(TemporalAdjusters.next(DayOfWeek.WEDNESDAY)).plusWeeks(5);
        String client = newClient();
        String id = holdId(client, service, wednesday.atTime(10, 0).atZone(Business.ZONE).toInstant().toString());
        mockMvc.perform(post("/api/v1/reservations/" + id + "/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isOk());

        agenda(provider, "SEMANA", wednesday)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.view").value("SEMANA"))
                .andExpect(jsonPath("$.from").value(wednesday.minusDays(2).toString()))
                .andExpect(jsonPath("$.to").value(wednesday.plusDays(4).toString()))
                .andExpect(jsonPath("$.days.length()").value(7))
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.days[2].openTime").value("09:00:00"))
                .andExpect(jsonPath("$.days[2].reservations[0].id").value(id))
                .andExpect(jsonPath("$.days[2].reservations[0].clientName").value("Cliente Agenda"))
                .andExpect(jsonPath("$.days[2].reservations[0].clientPhone").value("+573009998877"))
                .andExpect(jsonPath("$.days[2].reservations[0].serviceName").value("Masaje Agenda"))
                .andExpect(jsonPath("$.days[2].reservations[0].durationMinutes").value(60))
                .andExpect(jsonPath("$.days[2].reservations[0].status").value("CONFIRMADA"))
                .andExpect(jsonPath("$.days[6].openTime").doesNotExist());

        agenda(provider, "DIA", wednesday.plusDays(1))
                .andExpect(jsonPath("$.days.length()").value(1))
                .andExpect(jsonPath("$.days[0].reservations.length()").value(0))
                .andExpect(jsonPath("$.message").value("No tienes reservas programadas en este periodo"));

        agenda(provider, "MES", wednesday)
                .andExpect(jsonPath("$.from").value(wednesday.withDayOfMonth(1).toString()))
                .andExpect(jsonPath("$.days.length()").value(wednesday.lengthOfMonth()));

        mockMvc.perform(get("/api/v1/schedule/agenda").header("Authorization", bearer(provider)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.view").value("DIA"))
                .andExpect(jsonPath("$.from").value(LocalDate.now(Business.ZONE).toString()));
    }

    private ResultActions hours(String provider) throws Exception {
        return mockMvc.perform(get("/api/v1/schedule/hours").header("Authorization", bearer(provider)));
    }

    private ResultActions saveHours(String provider, String days) throws Exception {
        return mockMvc.perform(put("/api/v1/schedule/hours").header("Authorization", bearer(provider))
                .contentType(MediaType.APPLICATION_JSON).content("{\"days\":" + days + "}"));
    }

    private ResultActions agenda(String provider, String view, LocalDate date) throws Exception {
        return mockMvc.perform(get("/api/v1/schedule/agenda").header("Authorization", bearer(provider))
                .param("view", view).param("date", date.toString()));
    }

    private String holdId(String client, ServiceOffering service, String startAt) throws Exception {
        String body = mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceId\":\"%s\",\"startAt\":\"%s\"}".formatted(service.getId(), startAt)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Matcher matcher = ID_PATTERN.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No se encontro id en la respuesta: " + body);
        }
        return matcher.group(1);
    }

    // Weekdays 09:00-12:00 when withHours, otherwise no schedule configured.
    private Business newProvider(boolean withHours) {
        User user = new User("Proveedor", "Test", "prov." + System.nanoTime() + "@example.com", "+573001112233",
                "hash", UserRole.PROVEEDOR, true);
        user.verify();
        Business business = new Business(users.save(user), "Negocio Test", "Belleza", "Descripcion", "Calle 1");
        if (withHours) {
            business.replaceHours(Stream.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)
                    .map(day -> new BusinessHours(day, LocalTime.of(9, 0), LocalTime.of(12, 0)))
                    .toList());
        }
        return businesses.save(business);
    }

    private String newClient() {
        User user = new User("Cliente", "Agenda", "agenda." + System.nanoTime() + "@example.com", "+573009998877",
                "hash", UserRole.CLIENTE, true);
        user.verify();
        return users.save(user).getEmail();
    }

    private String bearer(String email) {
        return "Bearer " + sessions.open(users.findByEmailIgnoreCase(email).orElseThrow());
    }
}
