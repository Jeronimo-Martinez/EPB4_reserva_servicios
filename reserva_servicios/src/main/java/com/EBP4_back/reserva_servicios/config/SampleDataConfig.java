package com.EBP4_back.reserva_servicios.config;

import com.EBP4_back.reserva_servicios.domain.model.User;
import com.EBP4_back.reserva_servicios.domain.model.UserRepository;
import com.EBP4_back.reserva_servicios.domain.model.UserRole;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("demo")
public class SampleDataConfig {
    @Bean
    Object sampleData(UserRepository users, PasswordEncoder encoder) {
        if (!users.existsByEmailIgnoreCase("cliente.demo@example.com")) {
            User user = new User("Cliente", "Demo", "cliente.demo@example.com", "+573001234567",
                    encoder.encode("Cliente123"), UserRole.CLIENTE, true);
            user.verify();
            users.save(user);
        }
        return new Object();
    }
}