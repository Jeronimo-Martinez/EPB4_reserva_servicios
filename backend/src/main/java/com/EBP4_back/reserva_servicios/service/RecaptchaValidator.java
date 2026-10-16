package com.EBP4_back.reserva_servicios.service;

import com.EBP4_back.reserva_servicios.dto.RecaptchaVerifyResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

/**
 * Valida el token de reCAPTCHA v2 contra Google (siteverify).
 * Se invoca ANTES de cualquier logica de negocio en login/registro.
 */
@Service
public class RecaptchaValidator {

    private static final Logger log = LoggerFactory.getLogger(RecaptchaValidator.class);

    private final boolean enabled;
    private final String secretKey;
    private final String verifyUrl;
    private final RestClient restClient;

    public RecaptchaValidator(
            @Value("${app.recaptcha.enabled:true}") boolean enabled,
            @Value("${app.recaptcha.secret-key:}") String secretKey,
            @Value("${app.recaptcha.verify-url:https://www.google.com/recaptcha/api/siteverify}") String verifyUrl) {
        this.enabled = enabled;
        this.secretKey = secretKey;
        this.verifyUrl = verifyUrl;
        this.restClient = RestClient.create();
    }

    public void validate(String token) {
        if (!enabled) {
            log.warn("reCAPTCHA desactivado (app.recaptcha.enabled=false). Solo usar en perfil demo/tests.");
            return;
        }
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa el captcha para continuar");
        }
        if (secretKey == null || secretKey.isBlank()) {
            log.error("Falta configurar RECAPTCHA_SECRET_KEY en el backend");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verificacion de captcha no disponible. Intenta mas tarde");
        }
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("secret", secretKey);
            form.add("response", token);

            RecaptchaVerifyResponse verification = restClient.post()
                    .uri(verifyUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(RecaptchaVerifyResponse.class);

            if (verification == null || !verification.success()) {
                log.warn("reCAPTCHA rechazado: {}",
                        verification == null ? "respuesta vacia" : verification.errorCodes());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Verificacion de captcha fallida. Marcalo de nuevo e intenta otra vez");
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al verificar reCAPTCHA con Google", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No se pudo verificar el captcha. Intenta de nuevo");
        }
    }
}
