package com.EBP4_back.reserva_servicios.repository;

import com.EBP4_back.reserva_servicios.entity.PasswordResetCode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, UUID> {
    Optional<PasswordResetCode> findTopByUserEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(String email);
    List<PasswordResetCode> findAllByUserEmailIgnoreCaseAndUsedFalse(String email);
}
