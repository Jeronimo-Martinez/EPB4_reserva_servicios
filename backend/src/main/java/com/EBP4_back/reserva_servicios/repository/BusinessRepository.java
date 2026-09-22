package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.Business;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessRepository extends JpaRepository<Business, UUID> {
    Optional<Business> findByUserEmailIgnoreCase(String email);
    boolean existsByUserEmailIgnoreCase(String email);
}
