package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.Reservation;
import com.EBP4_back.reserva_servicios.enums.ReservationStatus;
import com.EBP4_back.reserva_servicios.repository.ReservationRepository;
import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-24: reminds clients of the reservations they have tomorrow (Bogota date). It runs every hour, and every
 * reservation is reminded once, so a restart or a late run the day before still sends each reminder exactly once.
 * shortcut: runs inside the web app, and Render's free plan sleeps without traffic; a day with no visit sends no
 * reminders. Trigger sendReminders from an external cron if they must never be missed.
 */
@Component
public class ReservationReminderJob {
    private final ReservationRepository reservations;
    private final ReservationNotifier notifier;

    public ReservationReminderJob(ReservationRepository reservations, ReservationNotifier notifier) {
        this.reservations = reservations;
        this.notifier = notifier;
    }

    @Scheduled(fixedDelayString = "${app.reminders.every:PT1H}", initialDelayString = "${app.reminders.first-run:PT1M}")
    @Transactional
    public void sendReminders() {
        LocalDate tomorrow = LocalDate.now(Business.ZONE).plusDays(1);
        for (Reservation reservation : reservations.findDueReminders(tomorrow.atStartOfDay(Business.ZONE).toInstant(),
                tomorrow.plusDays(1).atStartOfDay(Business.ZONE).toInstant(), ReservationStatus.CONFIRMADA)) {
            notifier.remindClient(reservation);
            reservation.markReminded();
        }
    }
}
