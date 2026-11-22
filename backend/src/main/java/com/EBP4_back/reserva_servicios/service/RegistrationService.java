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
import com.EBP4_back.reserva_servicios.security.SessionService;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationService {
    private static final String EMAIL_ALREADY_REGISTERED = "El correo electronico ya esta registrado";
    private static final String TERMS_REQUIRED = "Debe aceptar los terminos y condiciones";
    private static final String VERIFICATION_MESSAGE = "Se envio un codigo de verificacion al correo indicado";
    private static final Duration CODE_LIFETIME = Duration.ofMinutes(15);
    // Every code is an email (Brevo's free plan sends about 300 a day for the whole app), so they are rationed.
    private static final int MAX_CODES_PER_HOUR = 4;
    private final UserRepository userRepository;
    private final BusinessRepository businessRepository;
    private final VerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeSender codeSender;
    private final RecaptchaValidator recaptchaValidator;
    private final SessionService sessionService;
    private final PasswordPolicy passwordPolicy;
    private final SecureRandom random = new SecureRandom();

    public RegistrationService(UserRepository userRepository, BusinessRepository businessRepository,
            VerificationCodeRepository codeRepository, PasswordEncoder passwordEncoder,
            VerificationCodeSender codeSender, RecaptchaValidator recaptchaValidator, SessionService sessionService,
            PasswordPolicy passwordPolicy) {
        this.userRepository = userRepository;
        this.businessRepository = businessRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.codeSender = codeSender;
        this.recaptchaValidator = recaptchaValidator;
        this.sessionService = sessionService;
        this.passwordPolicy = passwordPolicy;
    }

    @Transactional
    public RegistrationResponse register(RegistrationRequest request) {
        recaptchaValidator.validate(request.recaptchaToken());
        String email = normalizeEmail(request.email());
        validatePassword(request.password());
        validateTerms(request.termsAccepted());
        releaseEmail(email);
        User user = userRepository.save(new User(request.firstName().trim(), normalize(request.lastName()), email,
                request.phone().trim(), passwordEncoder.encode(request.password()), UserRole.CLIENTE, true));
        issueVerificationCode(user);
        return new RegistrationResponse(VERIFICATION_MESSAGE, email, true);
    }

    @Transactional
    public RegistrationResponse registerProvider(ProviderRegistrationRequest request) {
        recaptchaValidator.validate(request.recaptchaToken());
        String email = normalizeEmail(request.email());
        validatePassword(request.password());
        validateTerms(request.termsAccepted());
        releaseEmail(email);
        User user = userRepository.save(new User(request.firstName().trim(), normalize(request.lastName()), email,
                request.phone().trim(), passwordEncoder.encode(request.password()), UserRole.PROVEEDOR, true));
        businessRepository.save(new Business(user, request.businessName().trim(), request.businessCategory().trim(),
                normalize(request.businessDescription()), request.address().trim()));
        issueVerificationCode(user);
        return new RegistrationResponse(VERIFICATION_MESSAGE, email, true);
    }

    // The wrong guess must be saved even though the request fails, so the error does not roll it back.
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public VerificationResponse verify(VerificationRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido"));
        VerificationCode code = codeRepository.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido"));
        if (!code.isValid(request.code(), Instant.now())) {
            if (code.recordFailure()) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Demasiados intentos con este codigo. Solicita uno nuevo");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El codigo no es valido o ha expirado");
        }
        code.markUsed();
        user.verify();
        // El negocio solo aplica a proveedores; para clientes queda vacio.
        Optional<Business> business = user.getRole() == UserRole.PROVEEDOR
                ? businessRepository.findByUserEmailIgnoreCase(user.getEmail())
                : Optional.empty();
        // Verifying the code proves the mailbox, so the user leaves this step already signed in.
        return new VerificationResponse("Registro verificado exitosamente", user.getEmail(), user.getRole().name(),
                sessionService.open(user), user.getFirstName(), user.getLastName(),
                business.map(Business::getName).orElse(null),
                business.map(Business::getCategory).orElse(null));
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
        // A code issued in the last hour still expires after (now - 1 h + lifetime).
        Instant lastHour = Instant.now().minus(Duration.ofHours(1)).plus(CODE_LIFETIME);
        if (codeRepository.countByUserEmailIgnoreCaseAndExpiresAtAfter(email, lastHour) >= MAX_CODES_PER_HOUR) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Ya solicitaste varios codigos. Espera un rato antes de pedir otro");
        }
        List<VerificationCode> pending = codeRepository.findAllByUserEmailIgnoreCaseAndUsedFalse(email);
        pending.forEach(VerificationCode::markUsed);
        issueVerificationCode(user);
        return new ResendCodeResponse("Se reenvio el codigo de verificacion al correo indicado", email);
    }

    private void issueVerificationCode(User user) {
        String code = "%06d".formatted(random.nextInt(1_000_000));
        codeRepository.save(new VerificationCode(user, code, Instant.now().plus(CODE_LIFETIME)));
        codeSender.send(user.getEmail(), code);
    }

    // An unverified account never proved it owns the mailbox: registering again replaces it, so a lost code
    // (or someone registering an address that is not theirs) cannot lock that email out forever.
    private void releaseEmail(String email) {
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isEmpty()) {
            return;
        }
        if (existing.get().isVerified()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, EMAIL_ALREADY_REGISTERED);
        }
        // Unverified users cannot log in, so they have no sessions, reservations or services to clean up.
        codeRepository.deleteAllByUserEmailIgnoreCase(email);
        businessRepository.findByUserEmailIgnoreCase(email).ifPresent(businessRepository::delete);
        userRepository.delete(existing.get());
        // Hibernate runs inserts before deletes; flushing now frees the unique email for the new row.
        userRepository.flush();
    }

    private void validatePassword(String password) {
        passwordPolicy.validate(password);
    }

    private void validateTerms(Boolean accepted) {
        if (!Boolean.TRUE.equals(accepted)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, TERMS_REQUIRED);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
