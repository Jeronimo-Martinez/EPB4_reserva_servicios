package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.VerificationCode;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {
    Optional<VerificationCode> findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(String email);
}