package com.EBP4_back.reserva_servicios.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Regla de contrasena segura compartida por el registro y la recuperacion de contrasena. */
@Component
public class PasswordPolicy {
    static final String PASSWORD_REQUIREMENTS =
            "La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero";

    public void validate(String password) {
        if (password == null || !password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PASSWORD_REQUIREMENTS);
        }
    }
}
