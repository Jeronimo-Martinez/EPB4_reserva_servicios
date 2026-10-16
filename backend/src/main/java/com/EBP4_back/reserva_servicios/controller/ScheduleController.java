package com.EBP4_back.reserva_servicios.controller;

import com.EBP4_back.reserva_servicios.dto.AgendaResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessHoursRequest;
import com.EBP4_back.reserva_servicios.dto.BusinessHoursResponse;
import com.EBP4_back.reserva_servicios.enums.AgendaView;
import com.EBP4_back.reserva_servicios.service.ScheduleService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/schedule")
public class ScheduleController {
    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/hours")
    public BusinessHoursResponse hours(@RequestParam("providerEmail") String providerEmail) {
        return scheduleService.getHours(providerEmail);
    }

    @PutMapping("/hours")
    public BusinessHoursResponse saveHours(@Valid @RequestBody BusinessHoursRequest request) {
        return scheduleService.saveHours(request);
    }

    @GetMapping("/agenda")
    public AgendaResponse agenda(@RequestParam("providerEmail") String providerEmail,
            @RequestParam(value = "view", defaultValue = "DIA") AgendaView view,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return scheduleService.agenda(providerEmail, view, date);
    }
}
