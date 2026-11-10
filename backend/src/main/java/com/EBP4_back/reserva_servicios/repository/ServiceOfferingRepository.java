package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {
    List<ServiceOffering> findAllByBusinessUserEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<ServiceOffering> findAllByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    // An empty string means "no filter". Never pass null: Hibernate binds an untyped null as bytea
    // on PostgreSQL and LOWER() fails.
    @Query("""
            SELECT s FROM ServiceOffering s
            WHERE (:search = ''
                    OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(s.business.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:category = '' OR LOWER(s.category) = LOWER(:category))
            ORDER BY s.createdAt DESC
            """)
    List<ServiceOffering> searchCatalog(@Param("search") String search, @Param("category") String category);

    // Counts active services grouped by category (lowercased) for the landing page stats.
    @Query("""
            SELECT LOWER(s.category) AS cat, COUNT(s) AS cnt
            FROM ServiceOffering s
            WHERE s.available = true
            GROUP BY LOWER(s.category)
            """)
    List<Object[]> countAvailableByCategory();
}
