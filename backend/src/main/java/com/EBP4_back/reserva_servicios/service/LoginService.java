package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.LoginRequest;
import com.EBP4_back.reserva_servicios.dto.LoginResponse;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoginService {
    private static final String INVALID_CREDENTIALS = "Correo electronico o contrasena incorrectos";
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecaptchaValidator recaptchaValidator;
    private final LoginAttemptService attemptService;
    private final SuspiciousLoginNotifier loginNotifier;

    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            RecaptchaValidator recaptchaValidator, LoginAttemptService attemptService,
            SuspiciousLoginNotifier loginNotifier) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.recaptchaValidator = recaptchaValidator;
        this.attemptService = attemptService;
        this.loginNotifier = loginNotifier;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, String clientIp) {
        recaptchaValidator.validate(request.recaptchaToken());
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        attemptService.assertNotBlocked(email, clientIp);
        // Anti-enumeracion: el fallo se cuenta aunque el email no exista y la
        // respuesta es siempre el 401 generico. El bloqueo (429) llega desde
        // el siguiente intento, sin verificar password (ahorra BCrypt).
        var user = userRepository.findByEmailIgnoreCase(email);
        boolean ok = user.isPresent()
                && user.get().isVerified()
                && passwordEncoder.matches(request.password(), user.get().getPasswordHash());
        if (!ok) {
            boolean justBlocked = attemptService.recordFailure(email, clientIp);
            if (justBlocked) {
                user.ifPresent(u -> loginNotifier.notifyBlockedAccount(u.getEmail(), clientIp));
            }
            throw invalidCredentials();
        }
        attemptService.recordSuccess(email);
        User found = user.get();
        String role = found.getRole().name();
        String redirectTo = "PROVEEDOR".equals(role) ? "/proveedor" : "/cliente";
        return new LoginResponse("Inicio de sesion exitoso", found.getEmail(), role, redirectTo);
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
    }
}