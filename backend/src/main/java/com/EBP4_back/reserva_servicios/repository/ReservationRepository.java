package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    // Expired holds are ignored here, so an expired slot is free again without any cleanup job.
    @Query("""
            SELECT COUNT(r) FROM Reservation r
            WHERE r.service.business.id = :businessId
              AND r.startAt < :endAt AND r.endAt > :startAt
              AND (r.status = :confirmed OR r.holdExpiresAt > :now)
            """)
    long countBlocking(@Param("businessId") UUID businessId, @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt, @Param("now") Instant now,
            @Param("confirmed") ReservationStatus confirmed);

    void deleteAllByClientEmailIgnoreCaseAndStatus(String email, ReservationStatus status);
}
