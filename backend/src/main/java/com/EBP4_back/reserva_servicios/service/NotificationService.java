package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.NotificationResponse;
import com.EBP4_back.reserva_servicios.entity.Notification;
import com.EBP4_back.reserva_servicios.repository.NotificationRepository;
import com.EBP4_back.reserva_servicios.security.AccessAuditService;
import com.EBP4_back.reserva_servicios.security.AuthUser;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** HU-24 inbox: each user reads and marks only its own notifications (the user comes from the session token). */
@Service
public class NotificationService {
    private final NotificationRepository notifications;
    private final AccessAuditService accessAudit;

    public NotificationService(NotificationRepository notifications, AccessAuditService accessAudit) {
        this.notifications = notifications;
        this.accessAudit = accessAudit;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(UUID userId) {
        return notifications.findTop50ByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NotificationResponse(n.getId(), n.getType().name(), n.getTitle(), n.getBody(),
                        n.getDetail(), n.isRead(), n.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void markRead(UUID id, AuthUser user) {
        Notification notification = notifications.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La notificacion no existe"));
        if (!notification.getRecipient().getId().equals(user.id())) {
            throw accessAudit.deny(user.email(), "VER_NOTIFICACION", "notificacion " + id, AccessAuditService.NOT_ALLOWED_VIEW);
        }
        notification.markRead();
    }
}
