package com.EBP4_back.reserva_servicios.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.BusinessHours;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import com.EBP4_back.reserva_servicios.service.ReservationNotifier;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-19 Reprogramacion de reserva. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ReservationRescheduleTest {
    // Lunes lejano y fijo para cada prueba: todas usan un negocio propio, asi no chocan con otros datos.
    private static final LocalDate MONDAY = LocalDate.now(Business.ZONE).with(TemporalAdjusters.next(DayOfWeek.MONDAY)).plusWeeks(2);

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private BusinessRepository businesses;
    @Autowired
    private ServiceOfferingRepository services;
    @Autowired
    private ReservationRepository reservations;
    @Autowired
    private SessionService sessions;
    @MockitoBean
    private ReservationNotifier notifier;

    @Test
    void reschedulesActiveReservationReleasingOldSlotAndNotifyingProvider() throws Exception {
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(18, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = confirmed(client, service, at(MONDAY, 10, 0));
        confirmed(newUser(UserRole.CLIENTE), service, at(MONDAY, 14, 0));
        Instant newStart = at(MONDAY.plusDays(1), 9, 30);

        // Solo horarios reales: sin el actual (10:00) ni los que chocan con otra reserva (13:30-14:30), y si los
        // que solo se cruzan con la propia reserva (10:30), porque ese horario se libera al confirmar.
        availability(client, reservation, MONDAY, MONDAY.plusDays(1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.days[0].date").value(MONDAY.toString()))
                .andExpect(jsonPath("$.days[0].slots[?(@ == '%s')]".formatted(at(MONDAY, 10, 0))).isEmpty())
                .andExpect(jsonPath("$.days[0].slots[?(@ == '%s')]".formatted(at(MONDAY, 10, 30))).isNotEmpty())
                .andExpect(jsonPath("$.days[0].slots[?(@ == '%s')]".formatted(at(MONDAY, 13, 30))).isEmpty())
                .andExpect(jsonPath("$.days[0].slots[?(@ == '%s')]".formatted(at(MONDAY, 14, 0))).isEmpty());

        hold(client, reservation, newStart)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.previousStartAt").value(at(MONDAY, 10, 0).toString()))
                .andExpect(jsonPath("$.newStartAt").value(newStart.toString()))
                .andExpect(jsonPath("$.newEndAt").value(newStart.plus(60, ChronoUnit.MINUTES).toString()))
                .andExpect(jsonPath("$.holdExpiresAt").exists());
        // Mientras el cliente confirma, el nuevo horario ya esta bloqueado para los demas.
        bookAsOther(service, newStart).andExpect(status().isConflict());

        mockMvc.perform(post(url(reservation) + "/reschedule/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tu reserva fue reprogramada exitosamente"))
                .andExpect(jsonPath("$.reservationId").value(reservation.getId().toString()))
                .andExpect(jsonPath("$.status").value("CONFIRMADA"))
                .andExpect(jsonPath("$.previousStartAt").value(at(MONDAY, 10, 0).toString()))
                .andExpect(jsonPath("$.newStartAt").value(newStart.toString()));

        mockMvc.perform(get(url(reservation)).header("Authorization", bearer(client)))
                .andExpect(jsonPath("$.startAt").value(newStart.toString()));
        verify(notifier).notifyRescheduled(any(Reservation.class), eq(at(MONDAY, 10, 0)), eq(at(MONDAY, 11, 0)));
        bookAsOther(service, at(MONDAY, 10, 0)).andExpect(status().isCreated());
        bookAsOther(service, newStart).andExpect(status().isConflict());
        // Sigue siendo una sola reserva en "Mis reservas".
        mockMvc.perform(get("/api/v1/reservations").header("Authorization", bearer(client)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void cancellingConfirmationKeepsOriginalSlotAndFreesTheSelectedOne() throws Exception {
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(18, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = confirmed(client, service, at(MONDAY, 10, 0));
        Instant newStart = at(MONDAY, 15, 0);
        hold(client, reservation, newStart).andExpect(status().isCreated());

        mockMvc.perform(delete(url(reservation) + "/reschedule").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "No se aplico la reprogramacion. Tu reserva mantiene su fecha y hora originales"))
                .andExpect(jsonPath("$.previousStartAt").value(at(MONDAY, 10, 0).toString()))
                .andExpect(jsonPath("$.newStartAt").doesNotExist());

        mockMvc.perform(get(url(reservation)).header("Authorization", bearer(client)))
                .andExpect(jsonPath("$.startAt").value(at(MONDAY, 10, 0).toString()));
        mockMvc.perform(post(url(reservation) + "/reschedule/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isConflict());
        bookAsOther(service, at(MONDAY, 10, 0)).andExpect(status().isConflict());
        bookAsOther(service, newStart).andExpect(status().isCreated());
        verify(notifier, never()).notifyRescheduled(any(), any(), any());
    }

    @Test
    void rejectsReservationThatAlreadyPassed() throws Exception {
        ServiceOffering service = newService(LocalTime.of(0, 0), LocalTime.of(23, 59));
        User client = newUser(UserRole.CLIENTE);
        Reservation past = confirmed(client, service, Instant.now().minus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS));

        availability(client, past, MONDAY, MONDAY)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No puedes reprogramar una reserva que ya pasó"));
        hold(client, past, at(MONDAY, 10, 0)).andExpect(status().isConflict());
    }

    @Test
    void rejectsCancelledReservation() throws Exception {
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(18, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = new Reservation(client, service, at(MONDAY, 10, 0), Instant.now());
        reservation.cancel(UserRole.CLIENTE, null);
        reservations.save(reservation);

        availability(client, reservation, MONDAY, MONDAY)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No puedes reprogramar una reserva cancelada"));
        hold(client, reservation, at(MONDAY, 12, 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("No puedes reprogramar una reserva cancelada"));
    }

    @Test
    void showsInformativeMessageWhenThereAreNoSlots() throws Exception {
        // Atiende una sola hora y ese unico espacio ya esta ocupado por otro cliente.
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(9, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = confirmed(client, service, at(MONDAY.plusWeeks(1), 8, 0));
        confirmed(newUser(UserRole.CLIENTE), service, at(MONDAY, 8, 0));

        availability(client, reservation, MONDAY, MONDAY)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").isEmpty())
                .andExpect(jsonPath("$.message").value("No hay horarios disponibles"));
    }

    @Test
    void rejectsTakenOrInvalidSlotsAndForeignClients() throws Exception {
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(18, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = confirmed(client, service, at(MONDAY, 10, 0));
        confirmed(newUser(UserRole.CLIENTE), service, at(MONDAY, 14, 0));

        hold(client, reservation, at(MONDAY, 14, 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("El horario seleccionado ya no esta disponible"));
        hold(client, reservation, at(MONDAY, 10, 0))
                .andExpect(jsonPath("$.message").value("Selecciona un horario diferente al actual"));
        hold(client, reservation, at(MONDAY, 17, 30)).andExpect(status().isBadRequest());
        mockMvc.perform(post(url(reservation) + "/reschedule").header("Authorization", bearer(client))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());

        User intruder = newUser(UserRole.CLIENTE);
        availability(intruder, reservation, MONDAY, MONDAY).andExpect(status().isForbidden());
        hold(intruder, reservation, at(MONDAY, 12, 0)).andExpect(status().isForbidden());
    }

    @Test
    void expiredSelectionMustBeChosenAgain() throws Exception {
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(18, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = confirmed(client, service, at(MONDAY, 10, 0));
        Reservation expired = Reservation.rescheduleHold(reservation, at(MONDAY, 12, 0), Instant.now().minusSeconds(1));
        reservations.save(expired);

        mockMvc.perform(post(url(reservation) + "/reschedule/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isGone());
        mockMvc.perform(get(url(reservation)).header("Authorization", bearer(client)))
                .andExpect(jsonPath("$.startAt").value(at(MONDAY, 10, 0).toString()));
    }

    @Test
    void rescheduleHoldCannotBeConfirmedAsANewReservation() throws Exception {
        ServiceOffering service = newService(LocalTime.of(8, 0), LocalTime.of(18, 0));
        User client = newUser(UserRole.CLIENTE);
        Reservation reservation = confirmed(client, service, at(MONDAY, 10, 0));
        hold(client, reservation, at(MONDAY, 12, 0)).andExpect(status().isCreated());
        Reservation hold = reservations.findFirstByRescheduleOfIdOrderByCreatedAtDesc(reservation.getId()).orElseThrow();

        mockMvc.perform(post("/api/v1/reservations/" + hold.getId() + "/confirm").header("Authorization", bearer(client)))
                .andExpect(status().isConflict());
    }

    private ResultActions availability(User client, Reservation reservation, LocalDate from, LocalDate to) throws Exception {
        return mockMvc.perform(get(url(reservation) + "/reschedule/availability")
                .param("from", from.toString()).param("to", to.toString())
                .header("Authorization", bearer(client)));
    }

    private ResultActions hold(User client, Reservation reservation, Instant startAt) throws Exception {
        return mockMvc.perform(post(url(reservation) + "/reschedule").header("Authorization", bearer(client))
                .contentType(MediaType.APPLICATION_JSON).content("{\"startAt\":\"%s\"}".formatted(startAt)));
    }

    private ResultActions bookAsOther(ServiceOffering service, Instant startAt) throws Exception {
        return mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(newUser(UserRole.CLIENTE)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceId\":\"%s\",\"startAt\":\"%s\"}".formatted(service.getId(), startAt)));
    }

    private Reservation confirmed(User client, ServiceOffering service, Instant startAt) {
        Reservation reservation = new Reservation(client, service, startAt, Instant.now());
        reservation.confirm();
        return reservations.save(reservation);
    }

    private ServiceOffering newService(LocalTime opens, LocalTime closes) {
        User provider = newUser(UserRole.PROVEEDOR);
        Business business = new Business(provider, "Negocio " + provider.getEmail(), "Salud y Bienestar", "Descripcion", "Calle 1");
        List<BusinessHours> hours = Stream.of(DayOfWeek.values()).map(day -> new BusinessHours(day, opens, closes)).toList();
        business.replaceHours(hours);
        return services.save(new ServiceOffering(businesses.save(business), "Masaje relajante", "Salud y Bienestar",
                "Descripcion", 60, new BigDecimal("80000"), true));
    }

    private User newUser(UserRole role) {
        User user = new User("Usuario", "Prueba", role.name().toLowerCase() + "." + System.nanoTime() + "@example.com",
                "+573001112233", "hash", role, true);
        user.verify();
        return users.save(user);
    }

    private static Instant at(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute).atZone(Business.ZONE).toInstant();
    }

    private static String url(Reservation reservation) {
        return "/api/v1/reservations/" + reservation.getId();
    }

    private String bearer(User user) {
        return "Bearer " + sessions.open(user);
    }
}
