package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.AvailabilityResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessDetailResponse;
import com.EBP4_back.reserva_servicios.dto.CatalogSearchResponse;
import com.EBP4_back.reserva_servicios.dto.CatalogServiceResponse;
import com.EBP4_back.reserva_servicios.dto.CategoryStatResponse;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.BusinessHours;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.enums.ServiceCategory;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CatalogService {
    private static final String CURRENCY = "COP";
    private static final String SERVICE_NOT_FOUND = "El servicio no existe";
    private static final int SLOT_STEP_MINUTES = 30;
    private static final int MAX_RANGE_DAYS = 31;
    private final ServiceOfferingRepository serviceRepository;
    private final BusinessRepository businessRepository;
    private final ReservationRepository reservationRepository;

    public CatalogService(ServiceOfferingRepository serviceRepository, BusinessRepository businessRepository,
            ReservationRepository reservationRepository) {
        this.serviceRepository = serviceRepository;
        this.businessRepository = businessRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public CatalogSearchResponse search(String search, String category) {
        String normalizedSearch = normalize(search);
        String normalizedCategory = normalize(category);
        List<CatalogServiceResponse> items = serviceRepository
                .searchCatalog(Objects.requireNonNullElse(normalizedSearch, ""),
                        Objects.requireNonNullElse(normalizedCategory, "")).stream()
                .map(this::toResponse)
                .toList();
        return new CatalogSearchResponse(items, items.size(), normalizedSearch, normalizedCategory);
    }

    @Transactional(readOnly = true)
    public List<CategoryStatResponse> categoryStats() {
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : serviceRepository.countAvailableByCategory()) {
            counts.put((String) row[0], (Long) row[1]);
        }
        return Stream.of(ServiceCategory.values())
                .map(cat -> new CategoryStatResponse(cat.name(), cat.getLabel(),
                        counts.getOrDefault(cat.getLabel().toLowerCase(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public CatalogServiceResponse getById(UUID id) {
        return toResponse(requireService(id));
    }

    @Transactional(readOnly = true)
    public BusinessDetailResponse getBusiness(UUID id) {
        return toDetail(businessRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El negocio no existe")));
    }

    @Transactional(readOnly = true)
    public List<BusinessDetailResponse> searchBusinesses(String search) {
        String term = normalize(search);
        return businessRepository.search(term == null ? "" : term).stream().map(this::toDetail).toList();
    }

    private BusinessDetailResponse toDetail(Business business) {
        List<CatalogServiceResponse> services = serviceRepository.findAllByBusinessIdOrderByCreatedAtDesc(business.getId()).stream()
                .map(this::toResponse)
                .toList();
        return new BusinessDetailResponse(business.getId(), business.getName(), business.getCategory(),
                business.getDescription(), business.getAddress(), business.getUser().getPhone(),
                business.getUser().getEmail(), BigDecimal.ZERO, 0, services);
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse availability(UUID serviceId, LocalDate from, LocalDate to) {
        ServiceOffering service = requireService(serviceId);
        LocalDate start = from == null ? LocalDate.now(Business.ZONE) : from;
        LocalDate end = to == null ? start.plusDays(6) : to;
        if (end.isBefore(start) || ChronoUnit.DAYS.between(start, end) >= MAX_RANGE_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El rango de fechas no es valido (maximo " + MAX_RANGE_DAYS + " dias)");
        }
        List<AvailabilityResponse.Day> days = isBookable(service) ? freeSlots(service, start, end) : List.of();
        return new AvailabilityResponse(service.getId(), service.getDurationMinutes(), Business.ZONE.getId(),
                days.isEmpty() ? "El servicio no tiene disponibilidad proxima" : null, days);
    }

    // A slot is offered when the whole service fits inside the opening hours and overlaps no reservation or active hold.
    private List<AvailabilityResponse.Day> freeSlots(ServiceOffering service, LocalDate from, LocalDate to) {
        Business business = service.getBusiness();
        Instant now = Instant.now();
        Duration duration = Duration.ofMinutes(service.getDurationMinutes());
        List<Reservation> busy = reservationRepository.findBlocking(business.getId(),
                from.atStartOfDay(Business.ZONE).toInstant(), to.plusDays(1).atStartOfDay(Business.ZONE).toInstant(),
                now, ReservationStatus.CONFIRMADA);
        List<AvailabilityResponse.Day> days = new ArrayList<>();
        for (LocalDate date : from.datesUntil(to.plusDays(1)).toList()) {
            Optional<BusinessHours> hours = business.hoursFor(date.getDayOfWeek());
            if (hours.isEmpty()) {
                continue;
            }
            ZonedDateTime close = date.atTime(hours.get().getEndTime()).atZone(Business.ZONE);
            List<Instant> slots = new ArrayList<>();
            for (ZonedDateTime slot = date.atTime(hours.get().getStartTime()).atZone(Business.ZONE);
                    !slot.plus(duration).isAfter(close); slot = slot.plusMinutes(SLOT_STEP_MINUTES)) {
                Instant startAt = slot.toInstant();
                Instant endAt = startAt.plus(duration);
                if (startAt.isAfter(now) && busy.stream()
                        .noneMatch(r -> r.getStartAt().isBefore(endAt) && r.getEndAt().isAfter(startAt))) {
                    slots.add(startAt);
                }
            }
            if (!slots.isEmpty()) {
                days.add(new AvailabilityResponse.Day(date, slots));
            }
        }
        return days;
    }

    private ServiceOffering requireService(UUID id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SERVICE_NOT_FOUND));
    }

    // Bookable means the provider kept the service active and has configured opening hours.
    private boolean isBookable(ServiceOffering service) {
        return service.isAvailable() && !service.getBusiness().getHours().isEmpty();
    }

    private CatalogServiceResponse toResponse(ServiceOffering service) {
        Business business = service.getBusiness();
        return new CatalogServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getCategory(),
                service.getDurationMinutes(),
                service.getPrice(),
                CURRENCY,
                business.getId(),
                business.getName(),
                business.getCategory(),
                isBookable(service),
                BigDecimal.ZERO,
                0);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
