package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.BusinessProfileResponse;
import com.EBP4_back.reserva_servicios.dto.BusinessProfileUpdateRequest;
import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.ServiceCategory;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * HU-06 Actualizacion de perfil del negocio. El negocio sale del token del proveedor, asi que nadie edita uno ajeno.
 * Los cambios se guardan en la misma fila que lee el catalogo publico, por eso los clientes los ven de inmediato.
 */
@Service
public class BusinessProfileService {
    private final BusinessRepository businessRepository;

    public BusinessProfileService(BusinessRepository businessRepository) {
        this.businessRepository = businessRepository;
    }

    @Transactional(readOnly = true)
    public BusinessProfileResponse get(String providerEmail) {
        return toResponse(requireBusiness(providerEmail), null);
    }

    /** Valida todo antes de tocar nada: un dato invalido responde 400 y el negocio conserva sus datos anteriores. */
    @Transactional
    public BusinessProfileResponse update(String providerEmail, BusinessProfileUpdateRequest request) {
        Business business = requireBusiness(providerEmail);
        String category = normalizeCategory(request.category(), business.getCategory());
        String description = request.description() == null || request.description().isBlank()
                ? null : request.description().trim();
        business.updateProfile(request.name().trim(), category, description, request.address().trim());
        User owner = business.getUser();
        owner.updateContact(owner.getFirstName(), owner.getLastName(), request.phone().trim());
        return toResponse(business, "Perfil del negocio actualizado correctamente");
    }

    /**
     * Acepta una categoria del catalogo por su etiqueta ("Salud y Bienestar") o su clave ("SALUD_Y_BIENESTAR", como la
     * guarda el registro) y la guarda como etiqueta, que es lo que muestra y filtra el catalogo. La categoria actual se
     * acepta tal cual aunque sea antigua, para que guardar otros cambios no obligue a cambiarla.
     */
    private static String normalizeCategory(String requested, String current) {
        String value = requested.trim();
        if (value.equalsIgnoreCase(current)) {
            return current;
        }
        return Stream.of(ServiceCategory.values())
                .filter(c -> c.name().equalsIgnoreCase(value) || c.getLabel().equalsIgnoreCase(value))
                .findFirst()
                .map(ServiceCategory::getLabel)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoria no es valida"));
    }

    private Business requireBusiness(String providerEmail) {
        String email = providerEmail == null ? "" : providerEmail.trim();
        return businessRepository.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "El proveedor no tiene un negocio registrado"));
    }

    private static BusinessProfileResponse toResponse(Business business, String message) {
        User owner = business.getUser();
        return new BusinessProfileResponse(message, business.getId(), business.getName(), business.getCategory(),
                business.getDescription(), business.getAddress(), owner.getPhone(), owner.getEmail());
    }
}
