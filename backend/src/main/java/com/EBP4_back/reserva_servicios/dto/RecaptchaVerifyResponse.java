package com.EBP4_back.reserva_servicios.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Respuesta del endpoint siteverify de Google reCAPTCHA v2. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record RecaptchaVerifyResponse(
        boolean success,
        @JsonProperty("challenge_ts") String challengeTs,
        String hostname,
        @JsonProperty("error-codes") List<String> errorCodes) {
}
