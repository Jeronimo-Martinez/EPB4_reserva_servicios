package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.ReservationHoldRequest;
import com.EBP4_back.reserva_servicios.dto.ReservationResponse;
import com.EBP4_back.reserva_servicios.security.AuthUser;
import com.EBP4_back.reserva_servicios.service.ReservationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping("/holds")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse hold(@Valid @RequestBody ReservationHoldRequest request,
            @AuthenticationPrincipal AuthUser user) {
        return reservationService.hold(request, user.email());
    }

    @GetMapping
    public List<ReservationResponse> mine(@AuthenticationPrincipal AuthUser user) {
        return reservationService.listOwn(user.id());
    }

    @GetMapping("/{id}")
    public ReservationResponse summary(@PathVariable UUID id, @AuthenticationPrincipal AuthUser user) {
        return reservationService.summary(id, user.email());
    }

    @PostMapping("/{id}/confirm")
    public ReservationResponse confirm(@PathVariable UUID id, @AuthenticationPrincipal AuthUser user) {
        return reservationService.confirm(id, user.email());
    }
}
