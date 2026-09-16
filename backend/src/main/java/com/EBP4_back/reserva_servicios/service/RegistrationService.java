package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.RegistrationRequest;
import com.EBP4_back.reserva_servicios.dto.RegistrationResponse;
import com.EBP4_back.reserva_servicios.dto.VerificationRequest;
import com.EBP4_back.reserva_servicios.dto.VerificationResponse;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.entity.VerificationCode;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.repository.VerificationCodeRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationService {
    private static final String PASSWORD_REQUIREMENTS = "La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero";
    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeSender codeSender;
    private final SecureRandom random = new SecureRandom();

    public RegistrationService(UserRepository userRepository, VerificationCodeRepository codeRepository,
            PasswordEncoder passwordEncoder, VerificationCodeSender codeSender) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.codeSender = codeSender;
    }

    @Transactional
    public RegistrationResponse register(RegistrationRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo electronico ya esta registrado");
        }
        if (!isStrongPassword(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_REQUIREMENTS);
        }
        if (!Boolean.TRUE.equals(request.termsAccepted())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe aceptar los terminos y condiciones");
        }
        User user = userRepository.save(new User(request.firstName().trim(), normalize(request.lastName()), email,
                request.phone().trim(), passwordEncoder.encode(request.password()), UserRole.CLIENTE, true));
        String code = "%06d".formatted(random.nextInt(1_000_000));
        codeRepository.save(new VerificationCode(user, code, Instant.now().plus(15, ChronoUnit.MINUTES)));
        codeSender.send(email, code);
        return new RegistrationResponse("Se envio un codigo de verificacion al correo indicado", email, true);
    }

    @Transactional
    public VerificationResponse verify(VerificationRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido"));
        VerificationCode code = codeRepository.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido"));
        if (!code.isValid(request.code(), Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido o ha expirado");
        }
        code.markUsed();
        user.verify();
        return new VerificationResponse("Registro verificado exitosamente", user.getEmail(), user.getRole().name());
    }

    private boolean isStrongPassword(String password) {
        return password != null && password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}