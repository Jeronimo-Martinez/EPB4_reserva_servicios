package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.Business;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BusinessRepository extends JpaRepository<Business, UUID> {
    Optional<Business> findByUserEmailIgnoreCase(String email);
    boolean existsByUserEmailIgnoreCase(String email);

    // A blank search lists every business; '' instead of null keeps PostgreSQL from typing the parameter as bytea.
    @Query("""
            SELECT b FROM Business b
            WHERE :search = ''
               OR LOWER(b.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(b.category) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(COALESCE(b.description, '')) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(b.address) LIKE LOWER(CONCAT('%', :search, '%'))
               OR EXISTS (SELECT s.id FROM ServiceOffering s
                          WHERE s.business = b AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY b.name
            """)
    List<Business> search(@Param("search") String search);
}
