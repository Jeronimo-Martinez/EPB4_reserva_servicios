package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.AvailabilityResponse;
import com.EBP4_back.reserva_servicios.dto.RescheduleRequest;
import com.EBP4_back.reserva_servicios.dto.RescheduleResponse;
import com.EBP4_back.reserva_servicios.dto.ReservationHoldRequest;
import com.EBP4_back.reserva_servicios.dto.ReservationResponse;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import com.EBP4_back.reserva_servicios.repository.ScheduleBlockRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.AccessAuditService;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {
    private static final int HOLD_MINUTES = 10;
    private static final String CURRENCY = "COP";
    private static final String OUTSIDE_HOURS = "El horario seleccionado esta fuera del horario de atencion del proveedor";
    private final ReservationRepository reservationRepository;
    private final ScheduleBlockRepository blockRepository;
    private final ServiceOfferingRepository serviceRepository;
    private final UserRepository userRepository;
    private final ReservationNotifier notifier;
    private final AccessAuditService accessAudit;
    private final CatalogService catalogService;

    public ReservationService(ReservationRepository reservationRepository, ScheduleBlockRepository blockRepository,
            ServiceOfferingRepository serviceRepository, UserRepository userRepository, ReservationNotifier notifier,
            AccessAuditService accessAudit, CatalogService catalogService) {
        this.reservationRepository = reservationRepository;
        this.blockRepository = blockRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.notifier = notifier;
        this.accessAudit = accessAudit;
        this.catalogService = catalogService;
    }

    @Transactional
    public ReservationResponse hold(ReservationHoldRequest request, String clientEmail) {
        User client = userRepository.findByEmailIgnoreCase(normalizeEmail(clientEmail))
                .filter(User::isVerified)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debe iniciar sesion para reservar"));
        ServiceOffering service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El servicio no existe"));
        if (!service.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El servicio no esta disponible por el momento");
        }
        Instant now = Instant.now();
        if (!request.startAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha y la hora deben ser futuras");
        }
        Reservation hold = new Reservation(client, service, request.startAt(), now.plus(HOLD_MINUTES, ChronoUnit.MINUTES));
        if (!service.getBusiness().isOpenDuring(hold.getStartAt(), hold.getEndAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, OUTSIDE_HOURS);
        }
        // Changing the selection replaces the previous hold of this client instead of blocking two slots.
        reservationRepository.deleteAllByClientEmailIgnoreCaseAndStatus(client.getEmail(), ReservationStatus.PENDIENTE);
        // shortcut: check-then-insert can let two simultaneous holds take the same slot; add a DB lock if concurrency grows.
        requireFree(service.getBusiness().getId(), hold.getStartAt(), hold.getEndAt(), now, null);
        return toResponse(reservationRepository.save(hold),
                "Horario reservado temporalmente por " + HOLD_MINUTES + " minutos, completa tu reserva");
    }

    // "Mis reservas": the client id comes from the session token, so other clients' reservations are never listed.
    // An abandoned hold (PENDIENTE past its expiry) is not a reservation and stays hidden, and neither is the
    // temporary hold of a reschedule in progress (HU-19): it only becomes part of the reservation when confirmed.
    @Transactional(readOnly = true)
    public List<ReservationResponse> listOwn(UUID clientId, String status) {
        ReservationStatus filter = parseStatus(status);
        Instant now = Instant.now();
        return reservationRepository.findAllByClientIdOrderByStartAtAsc(clientId).stream()
                .filter(reservation -> !reservation.isHoldExpired(now) && !reservation.isRescheduleHold())
                .filter(reservation -> filter == null || reservation.getStatus() == filter)
                .map(reservation -> toResponse(reservation, null)).toList();
    }

    private ReservationStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return ReservationStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de reserva no valido");
        }
    }

    @Transactional(readOnly = true)
    public ReservationResponse summary(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "VER_RESERVA", AccessAuditService.NOT_ALLOWED_VIEW);
        rejectIfExpired(reservation);
        return toResponse(reservation, switch (reservation.getStatus()) {
            case CONFIRMADA -> "Reserva confirmada";
            case CANCELADA -> "Reserva cancelada";
            case PENDIENTE -> "Horario reservado temporalmente";
        });
    }

    // HU 3.3.1: the client frees the slot; findBlocking ignores CANCELADA rows, so it becomes available again.
    @Transactional
    public ReservationResponse cancel(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "CANCELAR_RESERVA",
                "No tienes permitido cancelar esta reserva");
        ReservationStatus status = reservation.getStatus();
        if (reservation.isRescheduleHold()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este horario corresponde a una reprogramacion. Cancelala desde la reserva original");
        }
        if (status != ReservationStatus.PENDIENTE && status != ReservationStatus.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede cancelar una reserva pendiente o confirmada");
        }
        if (!reservation.getStartAt().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede cancelar una reserva que ya paso");
        }
        // A reschedule waiting for confirmation (HU-19) dies with the reservation, so its slot frees right away.
        reservationRepository.deleteAllByRescheduleOfId(id);
        reservation.cancel(UserRole.CLIENTE, null);
        return toResponse(reservation, "Reserva cancelada");
    }

    @Transactional
    public ReservationResponse confirm(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        if (reservation.getStatus() != ReservationStatus.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, reservation.getStatus() == ReservationStatus.CANCELADA
                    ? "La reserva fue cancelada" : "La reserva ya fue confirmada");
        }
        // A reschedule hold must not become a second reservation; it is applied through /reschedule/confirm.
        if (reservation.isRescheduleHold()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este horario corresponde a una reprogramacion. Confirmala desde la reserva original");
        }
        rejectIfExpired(reservation);
        reservation.confirm();
        notifier.notifyProvider(reservation);
        return toResponse(reservation, "Reserva confirmada exitosamente");
    }

    // ---------- HU-19 Reprogramacion de reserva ----------

    /** Paso 1: solo los horarios realmente libres del proveedor (o el mensaje "No hay horarios disponibles"). */
    @Transactional(readOnly = true)
    public AvailabilityResponse rescheduleAvailability(UUID id, String clientEmail, LocalDate from, LocalDate to) {
        Reservation reservation = requireReschedulable(id, clientEmail, "VER_RESERVA", AccessAuditService.NOT_ALLOWED_VIEW);
        return catalogService.rescheduleAvailability(reservation, from, to);
    }

    /**
     * Paso 2: bloquea temporalmente el nuevo horario y devuelve el resumen (horario anterior y nuevo) para que el
     * cliente confirme. La reserva todavia no cambia: si no confirma, el bloqueo vence o se cancela.
     */
    @Transactional
    public RescheduleResponse holdReschedule(UUID id, RescheduleRequest request, String clientEmail) {
        Reservation reservation = requireReschedulable(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        ServiceOffering service = reservation.getService();
        if (!service.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El servicio no esta disponible por el momento");
        }
        Instant now = Instant.now();
        if (!request.startAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha y la hora deben ser futuras");
        }
        if (request.startAt().equals(reservation.getStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un horario diferente al actual");
        }
        Reservation hold = Reservation.rescheduleHold(reservation, request.startAt(), now.plus(HOLD_MINUTES, ChronoUnit.MINUTES));
        if (!service.getBusiness().isOpenDuring(hold.getStartAt(), hold.getEndAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, OUTSIDE_HOURS);
        }
        // Changing the selection replaces the client's previous hold (booking or reschedule) instead of blocking two slots.
        reservationRepository.deleteAllByClientEmailIgnoreCaseAndStatus(reservation.getClient().getEmail(),
                ReservationStatus.PENDIENTE);
        // The reservation's own slot does not block its new one (it is released when the change is confirmed),
        // but other reservations, live holds and provider blocks (HU-10) do.
        requireFree(service.getBusiness().getId(), hold.getStartAt(), hold.getEndAt(), now, reservation.getId());
        reservationRepository.save(hold);
        return toRescheduleResponse(reservation, hold.getStartAt(), hold.getEndAt(), hold.getHoldExpiresAt(),
                "Al confirmar, el horario anterior se liberara y el nuevo quedara reservado. "
                        + service.getBusiness().getName() + " recibira una notificacion con ambos horarios");
    }

    /** Paso 3: aplica el cambio. Libera el horario anterior, ocupa el nuevo y avisa al proveedor. */
    @Transactional
    public RescheduleResponse confirmReschedule(UUID id, String clientEmail) {
        Reservation reservation = requireReschedulable(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        Reservation hold = reservationRepository.findFirstByRescheduleOfIdOrderByCreatedAtDesc(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "No hay un cambio de horario pendiente. Selecciona un nuevo horario"));
        Instant now = Instant.now();
        if (hold.isHoldExpired(now) || !hold.getStartAt().isAfter(now)) {
            reservationRepository.delete(hold);
            throw new ResponseStatusException(HttpStatus.GONE,
                    "El tiempo para confirmar el cambio expiro. Selecciona nuevamente la fecha y la hora");
        }
        Instant previousStart = reservation.getStartAt();
        Instant previousEnd = reservation.getEndAt();
        reservationRepository.delete(hold);
        reservation.reschedule(hold.getStartAt());
        notifier.notifyRescheduled(reservation, previousStart, previousEnd);
        return new RescheduleResponse("Tu reserva fue reprogramada exitosamente", reservation.getId(),
                reservation.getStatus().name(), reservation.getService().getBusiness().getName(),
                reservation.getService().getName(), reservation.getService().getDurationMinutes(),
                previousStart, previousEnd, reservation.getStartAt(), reservation.getEndAt(), null);
    }

    /** "Cancelar" en el mensaje de confirmacion: la reserva conserva su horario y el nuevo vuelve a quedar libre. */
    @Transactional
    public RescheduleResponse cancelReschedule(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        reservationRepository.deleteAllByRescheduleOfId(id);
        return toRescheduleResponse(reservation, null, null, null,
                "No se aplico la reprogramacion. Tu reserva mantiene su fecha y hora originales");
    }

    /** Solo una reserva confirmada, propia y que aun no ha pasado se puede reprogramar. */
    private Reservation requireReschedulable(UUID id, String clientEmail, String action, String message) {
        Reservation reservation = requireOwned(id, clientEmail, action, message);
        if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes reprogramar una reserva cancelada");
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo puedes reprogramar reservas confirmadas");
        }
        if (reservation.hasStarted(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes reprogramar una reserva que ya pasó");
        }
        return reservation;
    }

    private RescheduleResponse toRescheduleResponse(Reservation reservation, Instant newStart, Instant newEnd,
            Instant holdExpiresAt, String message) {
        ServiceOffering service = reservation.getService();
        return new RescheduleResponse(message, reservation.getId(), reservation.getStatus().name(),
                service.getBusiness().getName(), service.getName(), service.getDurationMinutes(),
                reservation.getStartAt(), reservation.getEndAt(), newStart, newEnd, holdExpiresAt);
    }

    // Free = no confirmed reservation, active hold or provider block (HU-10) overlaps it; ignoredId skips the one being moved.
    private void requireFree(UUID businessId, Instant startAt, Instant endAt, Instant now, UUID ignoredId) {
        boolean taken = reservationRepository.findBlocking(businessId, startAt, endAt, now, ReservationStatus.CONFIRMADA)
                .stream().anyMatch(r -> !r.getId().equals(ignoredId))
                || !blockRepository.findOverlapping(businessId, startAt, endAt).isEmpty();
        if (taken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El horario seleccionado ya no esta disponible");
        }
    }

    // The owner check uses the email from the session token, so changing the id in the URL never exposes data.
    private Reservation requireOwned(UUID id, String clientEmail, String action, String message) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La reserva no existe"));
        if (!reservation.getClient().getEmail().equalsIgnoreCase(normalizeEmail(clientEmail))) {
            throw accessAudit.deny(clientEmail, action, "reserva " + id, message);
        }
        return reservation;
    }

    private void rejectIfExpired(Reservation reservation) {
        if (reservation.isHoldExpired(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.GONE,
                    "El tiempo de reserva temporal expiro. Selecciona nuevamente la fecha y la hora");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private ReservationResponse toResponse(Reservation reservation, String message) {
        ServiceOffering service = reservation.getService();
        return new ReservationResponse(message, reservation.getId(), reservation.getStatus().name(),
                service.getBusiness().getName(), service.getName(), service.getDurationMinutes(),
                reservation.getStartAt(), reservation.getEndAt(), reservation.getTotalPrice(), CURRENCY,
                reservation.getHoldExpiresAt(), service.getId(),
                reservation.getCancelledBy() == null ? null : reservation.getCancelledBy().name(),
                reservation.getCancellationReason());
    }
}
