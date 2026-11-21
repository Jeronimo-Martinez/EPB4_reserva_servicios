package com.EBP4_back.reserva_servicios.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate created reservations.status with CHECK (status IN ('PENDIENTE','CONFIRMADA')) and ddl-auto=update never
 * rewrites it, so an existing database (Supabase) would reject CANCELADA. Dropping it is enough: the enum keeps the
 * values valid, and on a new database the statement does nothing.
 * shortcut: one-off schema fix at startup; move it to Flyway/Liquibase when a second migration appears.
 */
@Component
class ReservationStatusConstraintFix implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    ReservationStatusConstraintFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("ALTER TABLE IF EXISTS reservations DROP CONSTRAINT IF EXISTS reservations_status_check");
    }
}
