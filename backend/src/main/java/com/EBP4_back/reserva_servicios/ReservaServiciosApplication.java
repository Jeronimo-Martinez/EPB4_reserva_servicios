package com.EBP4_back.reserva_servicios;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ReservaServiciosApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReservaServiciosApplication.class, args);
	}

}
