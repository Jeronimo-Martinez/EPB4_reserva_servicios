package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
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

    // HU-24: confirmed reservations starting in [from, to) whose reminder has not been sent.
    @Query("""
            SELECT r FROM Reservation r JOIN FETCH r.client JOIN FETCH r.service s JOIN FETCH s.business
            WHERE r.status = :confirmed AND r.reminderSentAt IS NULL AND r.startAt >= :from AND r.startAt < :to
            """)
    List<Reservation> findDueReminders(@Param("from") Instant from, @Param("to") Instant to,
            @Param("confirmed") ReservationStatus confirmed);

    @EntityGraph(attributePaths = {"service", "service.business"})
    List<Reservation> findAllByClientIdAndStatusInOrderByStartAtAsc(UUID clientId, Collection<ReservationStatus> statuses);
}
