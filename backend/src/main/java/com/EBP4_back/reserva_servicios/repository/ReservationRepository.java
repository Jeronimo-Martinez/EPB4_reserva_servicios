package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    // Expired holds are ignored here, so an expired slot is free again without any cleanup job.
    @Query("""
            SELECT r FROM Reservation r JOIN FETCH r.client JOIN FETCH r.service s
            WHERE s.business.id = :businessId
              AND r.startAt < :endAt AND r.endAt > :startAt
              AND (r.status = :confirmed OR r.holdExpiresAt > :now)
            ORDER BY r.startAt
            """)
    List<Reservation> findBlocking(@Param("businessId") UUID businessId, @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt, @Param("now") Instant now,
            @Param("confirmed") ReservationStatus confirmed);

    void deleteAllByClientEmailIgnoreCaseAndStatus(String email, ReservationStatus status);

    @EntityGraph(attributePaths = {"service", "service.business"})
    List<Reservation> findAllByClientIdOrderByStartAtAsc(UUID clientId);

    // HU-22: historial del proveedor, de la cita mas reciente a la mas antigua.
    @EntityGraph(attributePaths = {"client", "service"})
    List<Reservation> findAllByServiceBusinessIdAndStatusInOrderByStartAtDesc(UUID businessId,
            Collection<ReservationStatus> statuses);

    // HU-19: bloqueo temporal del nuevo horario de una reprogramacion en curso.
    Optional<Reservation> findFirstByRescheduleOfIdOrderByCreatedAtDesc(UUID reservationId);

    void deleteAllByRescheduleOfId(UUID reservationId);
}
