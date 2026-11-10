package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.ReservationHoldRequest;
import com.EBP4_back.reserva_servicios.dto.ReservationResponse;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.AccessAuditService;
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
    private final ReservationRepository reservationRepository;
    private final ServiceOfferingRepository serviceRepository;
    private final UserRepository userRepository;
    private final ReservationNotifier notifier;
    private final AccessAuditService accessAudit;

    public ReservationService(ReservationRepository reservationRepository, ServiceOfferingRepository serviceRepository,
            UserRepository userRepository, ReservationNotifier notifier, AccessAuditService accessAudit) {
        this.reservationRepository = reservationRepository;
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El horario seleccionado esta fuera del horario de atencion del proveedor");
        }
        // Changing the selection replaces the previous hold of this client instead of blocking two slots.
        reservationRepository.deleteAllByClientEmailIgnoreCaseAndStatus(client.getEmail(), ReservationStatus.PENDIENTE);
        // shortcut: check-then-insert can let two simultaneous holds take the same slot; add a DB lock if concurrency grows.
        if (!reservationRepository.findBlocking(service.getBusiness().getId(), hold.getStartAt(), hold.getEndAt(),
                now, ReservationStatus.CONFIRMADA).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El horario seleccionado ya no esta disponible");
        }
        return toResponse(reservationRepository.save(hold),
                "Horario reservado temporalmente por " + HOLD_MINUTES + " minutos, completa tu reserva");
    }

    // "Mis reservas": the client id comes from the session token, so other clients' reservations are never listed.
    @Transactional(readOnly = true)
    public List<ReservationResponse> listOwn(UUID clientId) {
        return reservationRepository.findAllByClientIdAndStatusOrderByStartAtAsc(clientId, ReservationStatus.CONFIRMADA)
                .stream().map(reservation -> toResponse(reservation, null)).toList();
    }

    @Transactional(readOnly = true)
    public ReservationResponse summary(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "VER_RESERVA", AccessAuditService.NOT_ALLOWED_VIEW);
        rejectIfExpired(reservation);
        return toResponse(reservation, reservation.getStatus() == ReservationStatus.CONFIRMADA
                ? "Reserva confirmada" : "Horario reservado temporalmente");
    }

    @Transactional
    public ReservationResponse confirm(UUID id, String clientEmail) {
        Reservation reservation = requireOwned(id, clientEmail, "EDITAR_RESERVA", AccessAuditService.NOT_ALLOWED_EDIT);
        if (reservation.getStatus() == ReservationStatus.CONFIRMADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya fue confirmada");
        }
        rejectIfExpired(reservation);
        reservation.confirm();
        notifier.notifyProvider(reservation);
        return toResponse(reservation, "Reserva confirmada exitosamente");
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
                reservation.getHoldExpiresAt());
    }
}
