package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.ReservationHoldRequest;
import com.EBP4_back.reserva_servicios.dto.ReservationResponse;
import com.EBP4_back.reserva_servicios.entity.Business;
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
import java.time.Duration;
import java.time.Instant;
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

    public ReservationService(ReservationRepository reservationRepository, ScheduleBlockRepository blockRepository,
            ServiceOfferingRepository serviceRepository, UserRepository userRepository, ReservationNotifier notifier,
            AccessAuditService accessAudit) {
        this.reservationRepository = reservationRepository;
        this.blockRepository = blockRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.notifier = notifier;
        this.accessAudit = accessAudit;
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
    @Transactional(readOnly = true)
    public List<ReservationResponse> listOwn(UUID clientId) {
        return reservationRepository.findAllByClientIdAndStatusInOrderByStartAtAsc(clientId,
                        List.of(ReservationStatus.CONFIRMADA, ReservationStatus.CANCELADA))
                .stream().map(reservation -> toResponse(reservation, null)).toList();
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

    @Transactional
    public ReservationResponse confirm(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        if (reservation.getStatus() != ReservationStatus.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, reservation.getStatus() == ReservationStatus.CANCELADA
                    ? "La reserva fue cancelada" : "La reserva ya fue confirmada");
        }
        rejectIfExpired(reservation);
        reservation.confirm();
        notifier.notifyProvider(reservation);
        return toResponse(reservation, "Reserva confirmada exitosamente");
    }

    /** HU-19: moves an active reservation; the old slot frees itself because the same row now holds the new time. */
    @Transactional
    public ReservationResponse reschedule(UUID id, Instant newStartAt, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        Instant now = Instant.now();
        if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes reprogramar una reserva cancelada");
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo puedes reprogramar reservas confirmadas");
        }
        if (reservation.hasStarted(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes reprogramar una reserva que ya pasó");
        }
        if (!newStartAt.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha y la hora deben ser futuras");
        }
        Instant previousStartAt = reservation.getStartAt();
        Instant newEndAt = newStartAt.plus(Duration.between(previousStartAt, reservation.getEndAt()));
        Business business = reservation.getService().getBusiness();
        if (!business.isOpenDuring(newStartAt, newEndAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, OUTSIDE_HOURS);
        }
        requireFree(business.getId(), newStartAt, newEndAt, now, reservation.getId());
        reservation.reschedule(newStartAt);
        notifier.notifyRescheduled(reservation, previousStartAt);
        return toResponse(reservation, "Reserva reprogramada exitosamente");
    }

    /** The client cancels its own active reservation: the slot frees itself and the provider is notified (HU-24). */
    @Transactional
    public ReservationResponse cancel(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya fue cancelada");
        }
        if (reservation.getStatus() != ReservationStatus.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo puedes cancelar reservas confirmadas");
        }
        if (reservation.hasStarted(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No puedes cancelar una reserva que ya pasó");
        }
        reservation.cancel(UserRole.CLIENTE, null);
        notifier.notifyCancelledByClient(reservation);
        return toResponse(reservation, "Reserva cancelada");
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
