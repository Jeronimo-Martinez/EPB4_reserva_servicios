package com.EBP4_back.reserva_servicios.domain.model;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {
    Optional<VerificationCode> findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(String email);
}