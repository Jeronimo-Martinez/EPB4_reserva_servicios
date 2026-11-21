package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.AgendaResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessHoursRequest;
import com.EBP4_back.reserva_servicios.dto.BusinessHoursResponse;
import com.EBP4_back.reserva_servicios.dto.DayHours;
import com.EBP4_back.reserva_servicios.dto.ScheduleBlockRequest;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.BusinessHours;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.ScheduleBlock;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.AgendaView;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import com.EBP4_back.reserva_servicios.repository.ScheduleBlockRepository;
import com.EBP4_back.reserva_servicios.security.AccessAuditService;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ScheduleService {
    private static final Locale SPANISH = Locale.forLanguageTag("es");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(Business.ZONE);
    private final BusinessRepository businessRepository;
    private final ReservationRepository reservationRepository;
    private final ScheduleBlockRepository blockRepository;
    private final ReservationNotifier notifier;
    private final AccessAuditService accessAudit;

    public ScheduleService(BusinessRepository businessRepository, ReservationRepository reservationRepository,
            ScheduleBlockRepository blockRepository, ReservationNotifier notifier, AccessAuditService accessAudit) {
        this.businessRepository = businessRepository;
        this.reservationRepository = reservationRepository;
        this.blockRepository = blockRepository;
        this.notifier = notifier;
        this.accessAudit = accessAudit;
    }

    @Transactional(readOnly = true)
    public BusinessHoursResponse getHours(String providerEmail) {
        return toResponse(requireBusiness(providerEmail), null);
    }

    @Transactional
    public BusinessHoursResponse saveHours(BusinessHoursRequest request, String providerEmail) {
        Business business = requireBusiness(providerEmail);
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
        Instant rangeStart = from.atStartOfDay(Business.ZONE).toInstant();
        Instant rangeEnd = to.plusDays(1).atStartOfDay(Business.ZONE).toInstant();
        Map<LocalDate, List<AgendaResponse.Entry>> byDate = reservationRepository.findBlocking(business.getId(),
                        rangeStart, rangeEnd, Instant.now(), ReservationStatus.CONFIRMADA).stream()
                .map(this::toEntry)
                .collect(Collectors.groupingBy(entry -> entry.startAt().atZone(Business.ZONE).toLocalDate()));
        List<ScheduleBlock> blocks = blockRepository.findOverlapping(business.getId(), rangeStart, rangeEnd);
        List<AgendaResponse.Day> days = from.datesUntil(to.plusDays(1))
                .map(current -> {
                    Optional<BusinessHours> hours = business.hoursFor(current.getDayOfWeek());
                    return new AgendaResponse.Day(current,
                            hours.map(BusinessHours::getStartTime).orElse(null),
                            hours.map(BusinessHours::getEndTime).orElse(null),
                            byDate.getOrDefault(current, List.of()),
                            hours.map(h -> blocksDuring(current, h, blocks)).orElse(List.of()));
                })
                .toList();
        String message = byDate.isEmpty() ? "No tienes reservas programadas en este periodo" : null;
        return new AgendaResponse(view.name(), from, to, Business.ZONE.getId(), message, days);
    }

    /** HU-10: blocks a period. 409 if it overlaps another block; 428 while it hits reservations the provider has not accepted. */
    @Transactional
    public AgendaResponse.Block createBlock(ScheduleBlockRequest request, String providerEmail) {
        Business business = requireBusiness(providerEmail);
        if ((request.startTime() == null) != (request.endTime() == null)) {
            throw badRequest("Indica la hora inicial y la hora final, o deja ambas vacías para bloquear días completos");
        }
        Instant startAt = request.startDate().atTime(Objects.requireNonNullElse(request.startTime(), LocalTime.MIDNIGHT))
                .atZone(Business.ZONE).toInstant();
        Instant endAt = request.endTime() == null
                ? request.endDate().plusDays(1).atStartOfDay(Business.ZONE).toInstant()
                : request.endDate().atTime(request.endTime()).atZone(Business.ZONE).toInstant();
        Instant now = Instant.now();
        if (!startAt.isBefore(endAt)) {
            throw badRequest("El inicio del bloqueo debe ser anterior al final");
        }
        if (!endAt.isAfter(now)) {
            throw badRequest("El periodo seleccionado ya pasó");
        }
        if (!blockRepository.findOverlapping(business.getId(), startAt, endAt).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El periodo seleccionado ya está bloqueado");
        }
        // shortcut: active holds are not counted; one confirmed right after the block keeps its slot. Re-check on confirm if it matters.
        List<Reservation> affected = reservationRepository.findBlocking(business.getId(), startAt, endAt, now,
                        ReservationStatus.CONFIRMADA).stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMADA)
                .toList();
        if (!affected.isEmpty() && !request.confirmConflicts()) {
            // 428 = nothing saved yet: the frontend shows this warning and resends with confirmConflicts=true.
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, conflictWarning(affected));
        }
        String reason = request.reason() == null || request.reason().isBlank() ? null : request.reason().trim();
        ScheduleBlock block = blockRepository.save(new ScheduleBlock(business, startAt, endAt, reason));
        return new AgendaResponse.Block(block.getId(), block.getStartAt(), block.getEndAt(), block.getReason());
    }

    /** HU-20: the provider cancels an active reservation of its business; the slot frees because cancelled ones no longer block. */
    @Transactional
    public AgendaResponse.Entry cancelReservation(UUID id, String reason, String providerEmail) {
        Business business = requireBusiness(providerEmail);
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La reserva no existe"));
        if (!reservation.getService().getBusiness().getId().equals(business.getId())) {
            throw accessAudit.deny(providerEmail, "CANCELAR_RESERVA", "reserva " + id, AccessAuditService.NOT_ALLOWED_EDIT);
        }
        if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya fue cancelada");
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo puedes cancelar reservas confirmadas");
        }
        if (reservation.hasStarted(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes cancelar una reserva que ya pasó");
        }
        reservation.cancel(UserRole.PROVEEDOR, reason == null || reason.isBlank() ? null : reason.trim());
        notifier.notifyCancelledByProvider(reservation);
        return toEntry(reservation);
    }

    private static String conflictWarning(List<Reservation> affected) {
        String list = affected.stream()
                .map(r -> clientName(r.getClient()) + " (" + WHEN.format(r.getStartAt()) + ")")
                .collect(Collectors.joining(", "));
        return (affected.size() == 1 ? "Este bloqueo afecta 1 reserva programada: " : "Este bloqueo afecta "
                + affected.size() + " reservas programadas: ") + list
                + ". Las reservas se mantienen; si no podrás atenderlas, cancélalas desde tu agenda.";
    }

    // Only the opening hours of the day matter: outside them nothing could be booked anyway.
    private static List<AgendaResponse.Block> blocksDuring(LocalDate date, BusinessHours hours, List<ScheduleBlock> blocks) {
        Instant open = date.atTime(hours.getStartTime()).atZone(Business.ZONE).toInstant();
        Instant close = date.atTime(hours.getEndTime()).atZone(Business.ZONE).toInstant();
        return blocks.stream()
                .filter(b -> b.getStartAt().isBefore(close) && b.getEndAt().isAfter(open))
                .map(b -> new AgendaResponse.Block(b.getId(), b.getStartAt().isAfter(open) ? b.getStartAt() : open,
                        b.getEndAt().isBefore(close) ? b.getEndAt() : close, b.getReason()))
                .toList();
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

    private static String clientName(User client) {
        return client.getLastName() == null ? client.getFirstName() : client.getFirstName() + " " + client.getLastName();
    }

    private AgendaResponse.Entry toEntry(Reservation reservation) {
        User client = reservation.getClient();
        return new AgendaResponse.Entry(reservation.getId(), clientName(client), client.getEmail(), client.getPhone(),
                reservation.getService().getName(), reservation.getStartAt(), reservation.getEndAt(),
                reservation.getService().getDurationMinutes(), reservation.getStatus().name());
    }
}
