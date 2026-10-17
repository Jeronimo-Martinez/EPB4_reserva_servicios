package com.EBP4_back.reserva_servicios.security;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    static final String LOGIN_REQUIRED = "Debes iniciar sesion para continuar";
    static final String FUNCTION_DENIED = "No tienes permitido acceder a esta funcion";

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SessionService sessions, AccessAuditService audit)
            throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> { })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(new TokenAuthenticationFilter(sessions), UsernamePasswordAuthenticationFilter.class)
                // Least privilege: each role only reaches its own functions; the first matching rule wins.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/registrations/**", "/api/v1/auth/login", "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/catalog/**", "/api/v1/services/categories").permitAll()
                        .requestMatchers("/api/v1/services/**", "/api/v1/schedule/**").hasRole("PROVEEDOR")
                        .requestMatchers("/api/v1/reservations/**").hasRole("CLIENTE")
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                writeError(response, HttpServletResponse.SC_UNAUTHORIZED, LOGIN_REQUIRED))
                        .accessDeniedHandler((request, response, exception) -> {
                            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                            String email = auth != null && auth.getPrincipal() instanceof AuthUser user ? user.email() : "anonimo";
                            String reason = audit.deny(email, request.getMethod(), request.getRequestURI(), FUNCTION_DENIED)
                                    .getReason();
                            writeError(response, HttpServletResponse.SC_FORBIDDEN, reason);
                        }));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    // Same {status, message} shape as ApiExceptionHandler; messages are fixed texts without quotes.
    private static void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"status\":" + status + ",\"message\":\"" + message + "\"}");
    }
}
