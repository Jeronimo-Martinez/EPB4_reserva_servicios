package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.ReservationConfirmRequest;
import com.EBP4_back.reserva_servicios.dto.ReservationHoldRequest;
import com.EBP4_back.reserva_servicios.dto.ReservationResponse;
import com.EBP4_back.reserva_servicios.service.ReservationService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ReservationResponse hold(@Valid @RequestBody ReservationHoldRequest request) {
        return reservationService.hold(request);
    }

    @GetMapping("/{id}")
    public ReservationResponse summary(@PathVariable UUID id, @RequestParam("clientEmail") String clientEmail) {
        return reservationService.summary(id, clientEmail);
    }

    @PostMapping("/{id}/confirm")
    public ReservationResponse confirm(@PathVariable UUID id, @Valid @RequestBody ReservationConfirmRequest request) {
        return reservationService.confirm(id, request);
    }
}
