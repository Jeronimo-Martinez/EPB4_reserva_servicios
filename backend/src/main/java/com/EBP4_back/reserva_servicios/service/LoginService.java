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

    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> invalidCredentials());
        if (!user.isVerified() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        String role = user.getRole().name();
        String redirectTo = "PROVEEDOR".equals(role) ? "/proveedor" : "/cliente";
        return new LoginResponse("Inicio de sesion exitoso", user.getEmail(), role, redirectTo);
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
    }
}