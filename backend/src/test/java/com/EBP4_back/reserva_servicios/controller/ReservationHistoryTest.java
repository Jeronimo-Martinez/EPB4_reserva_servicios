package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** HU-22 Consulta de historial de reservas (Proveedor). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ReservationHistoryTest {
    private static final String URL = "/api/v1/schedule/history";

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
    @Autowired
    private PlatformTransactionManager transactionManager;
    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void listsAllReservationsOfTheBusinessWithDateClientServiceAndStatus() throws Exception {
        ServiceOffering service = newService();
        User provider = service.getBusiness().getUser();
        User laura = newClient("Laura", "Gomez");
        Reservation attended = reservation(laura, service, daysAgo(3), ReservationStatus.ATENDIDA);
        reservation(newClient("Camilo", "Ruiz"), service, daysAgo(5), ReservationStatus.NO_ASISTIO);
        reservation(newClient("Ana", "Torres"), service, daysAgo(6), ReservationStatus.CANCELADA);
        reservation(newClient("Sofia", "Martinez"), service, daysAgo(-2), ReservationStatus.CONFIRMADA);
        // Un bloqueo temporal (aun no es reserva) y las reservas de otro negocio no aparecen.
        reservations.save(new Reservation(newClient("Hold", "Activo"), service, daysAgo(-3), Instant.now().plusSeconds(600)));
        reservation(newClient("Otro", "Negocio"), newService(), daysAgo(1), ReservationStatus.CONFIRMADA);

        history(provider, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").doesNotExist())
                .andExpect(jsonPath("$.total").value(4))
                // De la mas reciente a la mas antigua.
                .andExpect(jsonPath("$.reservations[0].clientName").value("Sofia Martinez"))
                .andExpect(jsonPath("$.reservations[1].id").value(attended.getId().toString()))
                .andExpect(jsonPath("$.reservations[1].code").value(
                        "R-" + attended.getId().toString().substring(0, 4).toUpperCase()))
                .andExpect(jsonPath("$.reservations[1].startAt").value(attended.getStartAt().toString()))
                .andExpect(jsonPath("$.reservations[1].clientName").value("Laura Gomez"))
                .andExpect(jsonPath("$.reservations[1].serviceName").value("Masaje relajante"))
                .andExpect(jsonPath("$.reservations[1].status").value("ATENDIDA"))
                .andExpect(jsonPath("$.reservations[2].status").value("NO_ASISTIO"))
                .andExpect(jsonPath("$.reservations[3].status").value("CANCELADA"));
    }

    @Test
    void filtersByStatusKeepingAllColumns() throws Exception {
        ServiceOffering service = newService();
        User provider = service.getBusiness().getUser();
        reservation(newClient("Laura", "Gomez"), service, daysAgo(3), ReservationStatus.ATENDIDA);
        reservation(newClient("Sofia", "Martinez"), service, daysAgo(8), ReservationStatus.ATENDIDA);
        reservation(newClient("Ana", "Torres"), service, daysAgo(6), ReservationStatus.CANCELADA);

        history(provider, "ATENDIDA")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ATENDIDA"))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.reservations[*].status").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is("ATENDIDA"))))
                .andExpect(jsonPath("$.reservations[0].clientName").value("Laura Gomez"))
                .andExpect(jsonPath("$.reservations[0].serviceName").value("Masaje relajante"))
                .andExpect(jsonPath("$.reservations[0].startAt").exists());
        history(provider, "cancelada").andExpect(jsonPath("$.total").value(1));
        history(provider, "NO_ASISTIO")
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.message").value("No hay reservas con ese estado"));
    }

    @Test
    void showsInformativeMessageWhenTheBusinessHasNoReservations() throws Exception {
        history(newService().getBusiness().getUser(), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.reservations").isEmpty())
                .andExpect(jsonPath("$.message").value("Aun no hay reservas en el historial"));
    }

    @Test
    void rejectsUnknownStatusesAndNonProviders() throws Exception {
        User provider = newService().getBusiness().getUser();
        history(provider, "PENDIENTE").andExpect(status().isBadRequest());
        history(provider, "VOLADA").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Estado de reserva no valido"));
        history(newClient("Cliente", "Curioso"), null).andExpect(status().isForbidden());
    }

    private ResultActions history(User user, String status) throws Exception {
        var request = get(URL).header("Authorization", "Bearer " + sessions.open(user));
        return mockMvc.perform(status == null ? request : request.param("status", status));
    }

    private Reservation reservation(User client, ServiceOffering service, Instant startAt, ReservationStatus status) {
        Reservation reservation = new Reservation(client, service, startAt, Instant.now());
        reservation.confirm();
        if (status == ReservationStatus.CANCELADA) {
            reservation.cancel(UserRole.CLIENTE, null);
        }
        Reservation saved = reservations.save(reservation);
        if (status == ReservationStatus.ATENDIDA || status == ReservationStatus.NO_ASISTIO) {
            // Nada asigna aun estos estados (HU de asistencia pendiente): se fijan directamente en la base.
            new TransactionTemplate(transactionManager).executeWithoutResult(tx -> entityManager
                    .createQuery("UPDATE Reservation r SET r.status = :status WHERE r.id = :id")
                    .setParameter("status", status)
                    .setParameter("id", saved.getId())
                    .executeUpdate());
        }
        return saved;
    }

    private static Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
    }

    private ServiceOffering newService() {
        User provider = users.save(verified(new User("Proveedor", "Prueba",
                "proveedor." + System.nanoTime() + "@example.com", "+573001112233", "hash", UserRole.PROVEEDOR, true)));
        Business business = businesses.save(new Business(provider, "Negocio " + provider.getEmail(), "Salud y Bienestar",
                "Descripcion", "Calle 1"));
        return services.save(new ServiceOffering(business, "Masaje relajante", "Salud y Bienestar", "Descripcion", 60,
                new BigDecimal("80000"), true));
    }

    private User newClient(String firstName, String lastName) {
        return users.save(verified(new User(firstName, lastName, "cliente." + System.nanoTime() + "@example.com",
                "+573001112233", "hash", UserRole.CLIENTE, true)));
    }

    private static User verified(User user) {
        user.verify();
        return user;
    }
}
