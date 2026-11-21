package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.PasswordRecoveryRequest;
import com.EBP4_back.reserva_servicios.dto.PasswordRecoveryResponse;
import com.EBP4_back.reserva_servicios.dto.PasswordResetRequest;
import com.EBP4_back.reserva_servicios.dto.VerificationRequest;
import com.EBP4_back.reserva_servicios.entity.PasswordResetCode;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.repository.PasswordResetCodeRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * HU-04 Recuperacion de contrasena y HA-04 Robo de contrasena por recuperacion.
 * Flujo: solicitar codigo -> verificar codigo -> restablecer contrasena (con el mismo codigo, que alli se consume).
 */
@Service
public class PasswordRecoveryService {
    static final String INVALID_CODE = "El codigo no es valido";
    static final String EXPIRED_CODE = "El codigo expiro. Solicita uno nuevo";
    static final String PASSWORDS_DO_NOT_MATCH = "Las contrasenas no coinciden";
    static final String SAME_PASSWORD = "La nueva contrasena debe ser diferente a la actual";
    static final String CODE_VERIFIED = "Codigo verificado. Ya puedes crear una nueva contrasena";
    static final String PASSWORD_UPDATED =
            "Tu contrasena se cambio correctamente. Ya puedes iniciar sesion con la nueva contrasena";

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final RecoveryAttemptService attempts;
    private final LoginAttemptService loginAttempts;
    private final SessionService sessionService;
    private final PasswordRecoveryNotifier notifier;
    private final Duration codeLifetime;
    private final SecureRandom random = new SecureRandom();

    public PasswordRecoveryService(UserRepository userRepository, PasswordResetCodeRepository codeRepository,
            PasswordEncoder passwordEncoder, PasswordPolicy passwordPolicy, RecoveryAttemptService attempts,
            LoginAttemptService loginAttempts, SessionService sessionService, PasswordRecoveryNotifier notifier,
            @Value("${app.password-recovery.code-minutes:10}") long codeMinutes) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.attempts = attempts;
        this.loginAttempts = loginAttempts;
        this.sessionService = sessionService;
        this.notifier = notifier;
        this.codeLifetime = Duration.ofMinutes(codeMinutes);
    }

    /**
     * Siempre responde el mismo mensaje (anti-enumeracion): el codigo solo se genera y envia si el correo
     * pertenece a una cuenta verificada y su recuperacion no esta bloqueada.
     */
    @Transactional
    public PasswordRecoveryResponse requestCode(PasswordRecoveryRequest request) {
        String email = normalizeEmail(request.email());
        Optional<User> user = userRepository.findByEmailIgnoreCase(email).filter(User::isVerified);
        if (user.isPresent() && !attempts.isBlocked(email)) {
            invalidatePendingCodes(email);
            String code = "%06d".formatted(random.nextInt(1_000_000));
            codeRepository.save(new PasswordResetCode(user.get(), code, Instant.now().plus(codeLifetime)));
            notifier.sendRecoveryCode(user.get().getEmail(), user.get().getFirstName(), code, codeLifetime.toMinutes());
        }
        return new PasswordRecoveryResponse("Si el correo esta registrado, recibiras un codigo para crear una nueva "
                + "contrasena. El codigo vence en " + codeLifetime.toMinutes() + " minutos", email);
    }

    /** Comprueba el codigo sin consumirlo, para pasar a la pantalla de nueva contrasena. */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public PasswordRecoveryResponse verifyCode(VerificationRequest request) {
        String email = normalizeEmail(request.email());
        validCode(email, request.code());
        return new PasswordRecoveryResponse(CODE_VERIFIED, email);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public PasswordRecoveryResponse resetPassword(PasswordResetRequest request) {
        String email = normalizeEmail(request.email());
        PasswordResetCode code = validCode(email, request.code());
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORDS_DO_NOT_MATCH);
        }
        passwordPolicy.validate(request.newPassword());
        User user = code.getUser();
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, SAME_PASSWORD);
        }
        // Un solo uso: el codigo queda consumido y se cierran las sesiones que pudiera tener un atacante.
        code.markUsed();
        sessionService.closeAll(user.getEmail());
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        attempts.reset(email);
        // Quien controla el correo es el dueno: se le levanta el bloqueo de login por contrasenas incorrectas.
        loginAttempts.recordSuccess(email);
        notifier.notifyPasswordChanged(user.getEmail(), user.getFirstName());
        return new PasswordRecoveryResponse(PASSWORD_UPDATED, user.getEmail());
    }

    /**
     * Devuelve el codigo vigente o lanza: 429 si la recuperacion esta bloqueada, 410 si el codigo correcto ya expiro
     * y 400 en cualquier otro caso (correo inexistente incluido, para no revelar cuentas).
     */
    private PasswordResetCode validCode(String email, String candidate) {
        attempts.assertNotBlocked(email);
        Optional<PasswordResetCode> pending = codeRepository.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(email);
        if (pending.isEmpty() || !pending.get().matches(candidate)) {
            registerFailure(email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_CODE);
        }
        // Solo quien acierta el codigo sabe que expiro; asi el mensaje no revela si la cuenta existe.
        if (pending.get().isExpired(Instant.now())) {
            pending.get().markUsed();
            throw new ResponseStatusException(HttpStatus.GONE, EXPIRED_CODE);
        }
        return pending.get();
    }

    private void registerFailure(String email) {
        if (attempts.recordFailure(email)) {
            // El codigo vigente queda invalidado: tras el bloqueo hay que pedir uno nuevo.
            invalidatePendingCodes(email);
            userRepository.findByEmailIgnoreCase(email).ifPresent(user ->
                    notifier.notifyRecoveryBlocked(user.getEmail(), user.getFirstName(), attempts.blockMinutes()));
        }
    }

    private void invalidatePendingCodes(String email) {
        codeRepository.findAllByUserEmailIgnoreCaseAndUsedFalse(email).forEach(PasswordResetCode::markUsed);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
