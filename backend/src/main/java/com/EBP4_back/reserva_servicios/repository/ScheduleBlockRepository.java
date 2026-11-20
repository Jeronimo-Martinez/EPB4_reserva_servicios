package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.ScheduleBlock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleBlockRepository extends JpaRepository<ScheduleBlock, UUID> {
    @Query("""
            SELECT b FROM ScheduleBlock b
            WHERE b.business.id = :businessId AND b.startAt < :endAt AND b.endAt > :startAt
            ORDER BY b.startAt
            """)
    List<ScheduleBlock> findOverlapping(@Param("businessId") UUID businessId, @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt);
}
