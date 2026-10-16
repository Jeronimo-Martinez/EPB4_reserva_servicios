package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.AgendaResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessHoursRequest;
import com.EBP4_back.reserva_servicios.dto.BusinessHoursResponse;
import com.EBP4_back.reserva_servicios.dto.DayHours;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.BusinessHours;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.AgendaView;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ScheduleService {
    private static final Locale SPANISH = Locale.forLanguageTag("es");
    private final BusinessRepository businessRepository;
    private final ReservationRepository reservationRepository;

    public ScheduleService(BusinessRepository businessRepository, ReservationRepository reservationRepository) {
        this.businessRepository = businessRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public BusinessHoursResponse getHours(String providerEmail) {
        return toResponse(requireBusiness(providerEmail), null);
    }

    @Transactional
    public BusinessHoursResponse saveHours(BusinessHoursRequest request) {
        Business business = requireBusiness(request.providerEmail());
        Set<DayOfWeek> seen = EnumSet.noneOf(DayOfWeek.class);
        for (DayHours day : request.days()) {
            if (day == null || day.dayOfWeek() == null || day.startTime() == null || day.endTime() == null) {
                throw badRequest("Faltan datos de horario para uno o mas dias");
            }
            if (!seen.add(day.dayOfWeek())) {
                throw badRequest("El dia " + dayName(day.dayOfWeek()) + " esta repetido");
            }
            if (!day.startTime().isBefore(day.endTime())) {
                throw badRequest("La hora de inicio debe ser anterior a la hora de cierre ("
                        + dayName(day.dayOfWeek()) + ")");
            }
        }
        business.replaceHours(request.days().stream()
                .map(day -> new BusinessHours(day.dayOfWeek(), day.startTime(), day.endTime()))
                .toList());
        return toResponse(business, "Horario guardado exitosamente");
    }

    @Transactional(readOnly = true)
    public AgendaResponse agenda(String providerEmail, AgendaView view, LocalDate date) {
        Business business = requireBusiness(providerEmail);
        LocalDate day = date == null ? LocalDate.now(Business.ZONE) : date;
        LocalDate from = switch (view) {
            case DIA -> day;
            case SEMANA -> day.with(DayOfWeek.MONDAY);
            case MES -> day.withDayOfMonth(1);
        };
        LocalDate to = switch (view) {
            case DIA -> from;
            case SEMANA -> from.plusDays(6);
            case MES -> from.plusMonths(1).minusDays(1);
        };
        Map<LocalDate, List<AgendaResponse.Entry>> byDate = reservationRepository.findBlocking(business.getId(),
                        from.atStartOfDay(Business.ZONE).toInstant(), to.plusDays(1).atStartOfDay(Business.ZONE).toInstant(),
                        Instant.now(), ReservationStatus.CONFIRMADA).stream()
                .map(this::toEntry)
                .collect(Collectors.groupingBy(entry -> entry.startAt().atZone(Business.ZONE).toLocalDate()));
        List<AgendaResponse.Day> days = from.datesUntil(to.plusDays(1))
                .map(current -> {
                    Optional<BusinessHours> hours = business.hoursFor(current.getDayOfWeek());
                    return new AgendaResponse.Day(current,
                            hours.map(BusinessHours::getStartTime).orElse(null),
                            hours.map(BusinessHours::getEndTime).orElse(null),
                            byDate.getOrDefault(current, List.of()));
                })
                .toList();
        String message = byDate.isEmpty() ? "No tienes reservas programadas en este periodo" : null;
        return new AgendaResponse(view.name(), from, to, Business.ZONE.getId(), message, days);
    }

    private Business requireBusiness(String providerEmail) {
        String email = providerEmail == null ? "" : providerEmail.trim();
        return businessRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "El proveedor no tiene un negocio registrado"));
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private String dayName(DayOfWeek day) {
        return day.getDisplayName(TextStyle.FULL, SPANISH);
    }

    private BusinessHoursResponse toResponse(Business business, String message) {
        List<DayHours> days = business.getHours().stream()
                .sorted(Comparator.comparing(BusinessHours::getDayOfWeek))
                .map(hours -> new DayHours(hours.getDayOfWeek(), hours.getStartTime(), hours.getEndTime()))
                .toList();
        return new BusinessHoursResponse(message, Business.ZONE.getId(), days);
    }

    private AgendaResponse.Entry toEntry(Reservation reservation) {
        User client = reservation.getClient();
        String clientName = client.getLastName() == null
                ? client.getFirstName() : client.getFirstName() + " " + client.getLastName();
        return new AgendaResponse.Entry(reservation.getId(), clientName, client.getEmail(),
                reservation.getService().getName(), reservation.getStartAt(), reservation.getEndAt(),
                reservation.getService().getDurationMinutes(), reservation.getStatus().name());
    }
}
