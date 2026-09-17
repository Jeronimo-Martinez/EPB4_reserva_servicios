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

    @Query("""
            SELECT s FROM ServiceOffering s
            WHERE (:search IS NULL
                    OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(s.business.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(s.description, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:category IS NULL OR LOWER(s.category) = LOWER(:category))
            ORDER BY s.createdAt DESC
            """)
    List<ServiceOffering> searchCatalog(@Param("search") String search, @Param("category") String category);
}
