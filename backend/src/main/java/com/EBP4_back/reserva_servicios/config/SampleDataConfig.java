package com.EBP4_back.reserva_servicios.config;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.BusinessHours;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.stream.Stream;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("demo")
public class SampleDataConfig {
    @Bean
    Object sampleData(UserRepository users, BusinessRepository businesses, ServiceOfferingRepository services,
            PasswordEncoder encoder) {
        seedClient(users, encoder);
        seedProvider(users, businesses, services, encoder);
        return new Object();
    }

    private void seedClient(UserRepository users, PasswordEncoder encoder) {
        if (users.existsByEmailIgnoreCase("cliente.demo@example.com")) {
            return;
        }
        User client = new User("Cliente", "Demo", "cliente.demo@example.com", "+573001234567",
                encoder.encode("Cliente123"), UserRole.CLIENTE, true);
        client.verify();
        users.save(client);
    }

    private void seedProvider(UserRepository users, BusinessRepository businesses,
            ServiceOfferingRepository services, PasswordEncoder encoder) {
        if (users.existsByEmailIgnoreCase("veterinaria.demo@example.com")) {
            return;
        }
        User provider = new User("Jeronimo", "Martinez", "veterinaria.demo@example.com", "+573001112233",
                encoder.encode("Proveedor123"), UserRole.PROVEEDOR, true);
        provider.verify();
        User savedProvider = users.save(provider);
        Business veterinaria = new Business(savedProvider, "Veterinaria Huellitas", "Clinica veterinaria",
                "Clinica veterinaria para perros y gatos: consultas, vacunacion, peluqueria y cirugia.",
                "Cra 43A #1-50, Medellin");
        veterinaria.replaceHours(Stream.of(DayOfWeek.values()).filter(day -> day != DayOfWeek.SUNDAY)
                .map(day -> new BusinessHours(day, LocalTime.of(8, 0), LocalTime.of(18, 0)))
                .toList());
        Business business = businesses.save(veterinaria);
        services.save(new ServiceOffering(business, "Consulta General", "Consulta general",
                "Valoracion completa del estado de salud de tu mascota.", 30, new BigDecimal("60000.00"), true));
        services.save(new ServiceOffering(business, "Peluqueria Canina", "Peluqueria y estetica",
                "Bano, corte de pelo, corte de unas y limpieza de oidos.", 60, new BigDecimal("45000.00"), true));
        services.save(new ServiceOffering(business, "Vacunacion", "Vacunacion",
                "Aplicacion de vacunas segun el plan de vacunacion de tu mascota.", 20, new BigDecimal("50000.00"), true));
        services.save(new ServiceOffering(business, "Cirugia de Esterilizacion", "Cirugia",
                "Esterilizacion con anestesia general y control posoperatorio.", 120, new BigDecimal("250000.00"), false));
    }
}
