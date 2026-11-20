package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.ProfileResponse;
import com.EBP4_back.reserva_servicios.dto.ProfileUpdateRequest;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** HU-05: each user reads and edits only its own profile; the id comes from the session token. */
@Service
public class ProfileService {
    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(UUID userId) {
        return toResponse(require(userId), null);
    }

    @Transactional
    public ProfileResponse update(UUID userId, ProfileUpdateRequest request) {
        User user = require(userId);
        String lastName = request.lastName() == null || request.lastName().isBlank() ? null : request.lastName().trim();
        user.updateContact(request.firstName().trim(), lastName, request.phone().trim());
        return toResponse(user, "Perfil actualizado correctamente");
    }

    private User require(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El usuario no existe"));
    }

    private static ProfileResponse toResponse(User user, String message) {
        return new ProfileResponse(message, user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhone(),
                user.getRole().name(), user.isVerified());
    }
}
