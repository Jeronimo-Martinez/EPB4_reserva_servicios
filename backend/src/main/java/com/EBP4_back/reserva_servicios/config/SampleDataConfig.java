package com.EBP4_back.reserva_servicios.config;

import com.EBP4_back.reserva_servicios.entity.Business;
import com.EBP4_back.reserva_servicios.entity.ServiceOffering;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.BusinessRepository;
import com.EBP4_back.reserva_servicios.repository.ServiceOfferingRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import java.math.BigDecimal;
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
        if (users.existsByEmailIgnoreCase("centro.vital@example.com")) {
            return;
        }
        User provider = new User("Jeronimo", "Martinez", "centro.vital@example.com", "+573001112233",
                encoder.encode("Proveedor123"), UserRole.PROVEEDOR, true);
        provider.verify();
        User savedProvider = users.save(provider);
        Business business = businesses.save(new Business(savedProvider, "Centro Vital", "Salud y Bienestar",
                "Centro integral de servicios de salud, belleza y bienestar personal.",
                "Cra 43A #1-50, Medellin"));
        services.save(new ServiceOffering(business, "Corte de Cabello Clasico", "Belleza",
                "Corte personalizado con lavado y secado incluido.", 45, new BigDecimal("35000.00"), true));
        services.save(new ServiceOffering(business, "Masaje Descontracturante", "Salud y Bienestar",
                "Masaje profundo para aliviar tensiones musculares.", 60, new BigDecimal("80000.00"), true));
        services.save(new ServiceOffering(business, "Limpieza Facial Profunda", "Belleza",
                "Limpieza y exfoliacion facial con productos premium.", 90, new BigDecimal("110000.00"), false));
    }
}
