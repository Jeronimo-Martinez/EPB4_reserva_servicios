package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.ProviderRegistrationRequest;
import com.EBP4_back.reserva_servicios.dto.RegistrationRequest;
import com.EBP4_back.reserva_servicios.dto.RegistrationResponse;
import com.EBP4_back.reserva_servicios.dto.ResendCodeRequest;
import com.EBP4_back.reserva_servicios.dto.ResendCodeResponse;
import com.EBP4_back.reserva_servicios.dto.VerificationRequest;
import com.EBP4_back.reserva_servicios.dto.VerificationResponse;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.entity.VerificationCode;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.repository.VerificationCodeRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationService {
    private static final String PASSWORD_REQUIREMENTS = "La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero";
    private static final String EMAIL_ALREADY_REGISTERED = "El correo electronico ya esta registrado";
    private static final String TERMS_REQUIRED = "Debe aceptar los terminos y condiciones";
    private static final String VERIFICATION_MESSAGE = "Se envio un codigo de verificacion al correo indicado";
    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final VerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeSender codeSender;
    private final SecureRandom random = new SecureRandom();

    public RegistrationService(UserRepository userRepository, BusinessRepository businessRepository,
            VerificationCodeRepository codeRepository, PasswordEncoder passwordEncoder,
            VerificationCodeSender codeSender) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.codeSender = codeSender;
    }

    @Transactional
    public RegistrationResponse register(RegistrationRequest request) {
        String email = normalizeEmail(request.email());
        validateUniqueEmail(email);
        validatePassword(request.password());
        validateTerms(request.termsAccepted());
        User user = userRepository.save(new User(request.firstName().trim(), normalize(request.lastName()), email,
                request.phone().trim(), passwordEncoder.encode(request.password()), UserRole.CLIENTE, true));
        issueVerificationCode(user);
        return new RegistrationResponse(VERIFICATION_MESSAGE, email, true);
    }

    @Transactional
    public RegistrationResponse registerProvider(ProviderRegistrationRequest request) {
        String email = normalizeEmail(request.email());
        validateUniqueEmail(email);
        validatePassword(request.password());
        validateTerms(request.termsAccepted());
        User user = userRepository.save(new User(request.firstName().trim(), normalize(request.lastName()), email,
                request.phone().trim(), passwordEncoder.encode(request.password()), UserRole.PROVEEDOR, true));
        businessRepository.save(new Business(user, request.businessName().trim(), request.businessCategory().trim(),
                normalize(request.businessDescription()), request.address().trim()));
        issueVerificationCode(user);
        return new RegistrationResponse(VERIFICATION_MESSAGE, email, true);
    }

    @Transactional
    public VerificationResponse verify(VerificationRequest request) {
        String email = normalizeEmail(request.email());
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

    @Transactional
    public ResendCodeResponse resendCode(ResendCodeRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No existe un registro pendiente con ese correo"));
        if (user.isVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo ya se encuentra verificado");
        }
        List<VerificationCode> pending = codeRepository.findAllByUserEmailIgnoreCaseAndUsedFalse(email);
        pending.forEach(VerificationCode::markUsed);
        issueVerificationCode(user);
        return new ResendCodeResponse("Se reenvio el codigo de verificacion al correo indicado", email);
    }

    private void issueVerificationCode(User user) {
        String code = "%06d".formatted(random.nextInt(1_000_000));
        codeRepository.save(new VerificationCode(user, code, Instant.now().plus(15, ChronoUnit.MINUTES)));
        codeSender.send(user.getEmail(), code);
    }

    private void validateUniqueEmail(String email) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, EMAIL_ALREADY_REGISTERED);
        }
    }

    private void validatePassword(String password) {
        if (!isStrongPassword(password)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_REQUIREMENTS);
        }
    }

    private void validateTerms(Boolean accepted) {
        if (!Boolean.TRUE.equals(accepted)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, TERMS_REQUIRED);
        }
    }

    private boolean isStrongPassword(String password) {
        return password != null && password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
