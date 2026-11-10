package com.EBP4_back.reserva_servicios.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class ReservationControllerTest {
    private static final String CLIENT = "cliente.demo@example.com";
    private static final Pattern ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([0-9a-fA-F\\-]+)\"");

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ServiceOfferingRepository services;
    @Autowired
    private UserRepository users;
    @Autowired
    private SessionService sessions;
    @Autowired
    private PlatformTransactionManager transactionManager;
    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void holdShowsSummaryAndConfirmCreatesReservation() throws Exception {
        String id = holdId(CLIENT, serviceId("Masaje Descontracturante"), slot(9));

        mockMvc.perform(get("/api/v1/reservations/" + id).header("Authorization", bearer(CLIENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDIENTE"))
                .andExpect(jsonPath("$.businessName").value("Centro Vital"))
                .andExpect(jsonPath("$.serviceName").value("Masaje Descontracturante"))
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.currency").value("COP"))
                .andExpect(jsonPath("$.holdExpiresAt").exists());

        confirm(id, CLIENT)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.status").value("CONFIRMADA"))
                .andExpect(jsonPath("$.holdExpiresAt").doesNotExist());

        confirm(id, CLIENT).andExpect(status().isConflict());
    }

    @Test
    void heldSlotBlocksOthersAndChangingSelectionReplacesHold() throws Exception {
        Instant slot = slot(11);
        String first = holdId(CLIENT, serviceId("Masaje Descontracturante"), slot);

        hold(otherClient(), serviceId("Masaje Descontracturante"), slot).andExpect(status().isConflict());

        // Going back and picking another service for the same slot must not collide with the own previous hold.
        holdId(CLIENT, serviceId("Corte de Cabello Clasico"), slot);
        mockMvc.perform(get("/api/v1/reservations/" + first).header("Authorization", bearer(CLIENT)))
                .andExpect(status().isNotFound());
    }

    @Test
    void expiredHoldIsRejectedAndFreesTheSlot() throws Exception {
        Instant slot = slot(13);
        String id = holdId(CLIENT, serviceId("Masaje Descontracturante"), slot);
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> entityManager
                .createQuery("UPDATE Reservation r SET r.holdExpiresAt = :past WHERE r.id = :id")
                .setParameter("past", Instant.now().minusSeconds(1))
                .setParameter("id", UUID.fromString(id))
                .executeUpdate());

        confirm(id, CLIENT).andExpect(status().isGone());
        hold(otherClient(), serviceId("Masaje Descontracturante"), slot).andExpect(status().isCreated());
    }

    @Test
    void rejectsIncompleteDataUnavailableServiceAndForeignClient() throws Exception {
        mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(CLIENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceId\":\"" + serviceId("Masaje Descontracturante") + "\"}"))
                .andExpect(status().isBadRequest());
        hold(CLIENT, serviceId("Limpieza Facial Profunda"), slot(15)).andExpect(status().isConflict());
        // 17:30 + 60 min ends after the 18:00 closing time.
        hold(CLIENT, serviceId("Masaje Descontracturante"), slot(17).plusSeconds(1800)).andExpect(status().isBadRequest());

        String id = holdId(CLIENT, serviceId("Masaje Descontracturante"), slot(15));
        confirm(id, otherClient()).andExpect(status().isForbidden());
    }

    // HU-21: the client sees every reservation of the account and can filter by state.
    @Test
    void mineFiltersByStatusAndNeverListsExpiredHolds() throws Exception {
        String client = otherClient();
        UUID service = serviceId("Masaje Descontracturante");

        String confirmed = holdId(client, service, slot(10));
        confirm(confirmed, client);
        String cancelled = holdId(client, service, slot(12));
        confirm(cancelled, client);
        String attended = holdId(client, service, slot(14));
        confirm(attended, client);
        String noShow = holdId(client, service, slot(16));
        confirm(noShow, client);
        setStatus(cancelled, ReservationStatus.CANCELADA);
        setStatus(attended, ReservationStatus.ATENDIDA);
        setStatus(noShow, ReservationStatus.NO_ASISTIDA);
        // An abandoned hold expires and must never show up as a reservation of the client.
        String expired = holdId(client, service, slot(17));
        expireHold(expired);

        mockMvc.perform(get("/api/v1/reservations").header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].id").value(confirmed))
                .andExpect(jsonPath("$[0].status").value("CONFIRMADA"))
                .andExpect(jsonPath("$[1].id").value(cancelled))
                .andExpect(jsonPath("$[1].status").value("CANCELADA"))
                .andExpect(jsonPath("$[2].status").value("ATENDIDA"))
                .andExpect(jsonPath("$[3].status").value("NO_ASISTIDA"));

        mockMvc.perform(get("/api/v1/reservations").param("status", "CANCELADA")
                        .header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(cancelled));

        mockMvc.perform(get("/api/v1/reservations").param("status", "ATENDIDA")
                        .header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(attended));

        mockMvc.perform(get("/api/v1/reservations").param("status", "no_asistida")
                        .header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(noShow));

        mockMvc.perform(get("/api/v1/reservations").param("status", "CONFIRMADA")
                        .header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(confirmed));

        // The expired hold is not a reservation, so filtering by PENDIENTE returns nothing.
        mockMvc.perform(get("/api/v1/reservations").param("status", "PENDIENTE")
                        .header("Authorization", bearer(client)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/v1/reservations").param("status", "INVENTADA")
                        .header("Authorization", bearer(client)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Estado de reserva no valido"));
    }

    private void setStatus(String id, ReservationStatus status) {
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> entityManager
                .createQuery("UPDATE Reservation r SET r.status = :status WHERE r.id = :id")
                .setParameter("status", status)
                .setParameter("id", UUID.fromString(id))
                .executeUpdate());
    }

    private void expireHold(String id) {
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> entityManager
                .createQuery("UPDATE Reservation r SET r.holdExpiresAt = :past WHERE r.id = :id")
                .setParameter("past", Instant.now().minusSeconds(1))
                .setParameter("id", UUID.fromString(id))
                .executeUpdate());
    }

    private ResultActions hold(String email, UUID serviceId, Instant startAt) throws Exception {
        return mockMvc.perform(post("/api/v1/reservations/holds").header("Authorization", bearer(email))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceId\":\"%s\",\"startAt\":\"%s\"}".formatted(serviceId, startAt)));
    }

    private String holdId(String email, UUID serviceId, Instant startAt) throws Exception {
        String body = hold(email, serviceId, startAt).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Matcher matcher = ID_PATTERN.matcher(body);
        if (!matcher.find()) {
            throw new IllegalStateException("No se encontro id en la respuesta: " + body);
        }
        return matcher.group(1);
    }

    private ResultActions confirm(String id, String email) throws Exception {
        return mockMvc.perform(post("/api/v1/reservations/" + id + "/confirm").header("Authorization", bearer(email)));
    }

    private UUID serviceId(String name) {
        return services.findAll().stream().filter(s -> s.getName().equals(name))
                .map(ServiceOffering::getId).findFirst().orElseThrow();
    }

    private String otherClient() {
        User user = new User("Otro", "Cliente", "otro." + System.nanoTime() + "@example.com", "+573009998877",
                "hash", UserRole.CLIENTE, true);
        user.verify();
        return users.save(user).getEmail();
    }

    // Centro Vital (demo data) attends Monday to Saturday 08:00-18:00 Bogota time.
    private Instant slot(int hour) {
        return LocalDate.now(Business.ZONE).with(TemporalAdjusters.next(DayOfWeek.MONDAY)).plusWeeks(4)
                .atTime(hour, 0).atZone(Business.ZONE).toInstant();
    }

    private String bearer(String email) {
        return "Bearer " + sessions.open(users.findByEmailIgnoreCase(email).orElseThrow());
    }
}
