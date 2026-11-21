package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.LoginRequest;
import com.EBP4_back.reserva_servicios.dto.LoginResponse;
import com.EBP4_back.reserva_servicios.security.SessionService;
import com.EBP4_back.reserva_servicios.service.LoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class LoginController {
    private final LoginService loginService;
    private final SessionService sessionService;

    public LoginController(LoginService loginService, SessionService sessionService) {
        this.loginService = loginService;
        this.sessionService = sessionService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return loginService.login(request, clientIp(httpRequest));
    }

    /** Revokes the current token; only reachable with a valid session (see SecurityConfig). */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String authorization) {
        sessionService.close(authorization.substring("Bearer ".length()).trim());
    }

    /**
     * IP real del cliente. Render's proxy appends it at the end of X-Forwarded-For; the earlier entries come from
     * the client and can be forged to dodge the per-IP login limit.
     */
    private String clientIp(HttpServletRequest httpRequest) {
        String forwarded = httpRequest.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] hops = forwarded.split(",");
            return hops[hops.length - 1].trim();
        }
        return httpRequest.getRemoteAddr();
    }
}