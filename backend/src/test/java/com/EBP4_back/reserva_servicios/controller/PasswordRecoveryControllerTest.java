package com.EBP4_back.reserva_servicios.controller;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.EBP4_back.reserva_servicios.entity.PasswordResetCode;
import com.EBP4_back.reserva_servicios.entity.User;
import com.EBP4_back.reserva_servicios.enums.UserRole;
import com.EBP4_back.reserva_servicios.repository.PasswordResetCodeRepository;
import com.EBP4_back.reserva_servicios.repository.UserRepository;
import com.EBP4_back.reserva_servicios.security.SessionService;
import com.EBP4_back.reserva_servicios.service.PasswordRecoveryNotifier;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-04 Recuperacion de contrasena y HA-04 Robo de contrasena por recuperacion. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class PasswordRecoveryControllerTest {
    private static final String OLD_PASSWORD = "Antigua123";
    private static final String NEW_PASSWORD = "Nueva12345";
    private static final String BASE = "/api/v1/auth/password-recovery";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private PasswordResetCodeRepository codes;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private SessionService sessions;
    @MockitoBean
    private PasswordRecoveryNotifier notifier;

    @Test
    void recoversPasswordWithEmailedCodeAndNotifiesTheChange() throws Exception {
        User user = newUser();
        String session = "Bearer " + sessions.open(user);
        String code = requestCode(user.getEmail());

        mockMvc.perform(post(BASE + "/verify-code").contentType(MediaType.APPLICATION_JSON)
                        .content(codeJson(user.getEmail(), code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Codigo verificado. Ya puedes crear una nueva contrasena"));
        reset(user.getEmail(), code, NEW_PASSWORD, NEW_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Tu contrasena se cambio correctamente. Ya puedes iniciar sesion con la nueva contrasena"));

        login(user.getEmail(), NEW_PASSWORD).andExpect(status().isOk());
        login(user.getEmail(), OLD_PASSWORD).andExpect(status().isUnauthorized());
        verify(notifier).notifyPasswordChanged(eq(user.getEmail()), anyString());
        // Las sesiones abiertas antes del cambio quedan invalidadas.
        mockMvc.perform(get("/api/v1/reservations").header("Authorization", session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsIncorrectCodeAndKeepsThePassword() throws Exception {
        User user = newUser();
        String code = requestCode(user.getEmail());
        String wrong = code.equals("000000") ? "111111" : "000000";

        mockMvc.perform(post(BASE + "/verify-code").contentType(MediaType.APPLICATION_JSON)
                        .content(codeJson(user.getEmail(), wrong)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El codigo no es valido"));
        reset(user.getEmail(), wrong, NEW_PASSWORD, NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El codigo no es valido"));

        login(user.getEmail(), OLD_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void reportsExpiredCodeAndOffersANewOne() throws Exception {
        User user = newUser();
        codes.save(new PasswordResetCode(user, "123456", Instant.now().minus(11, ChronoUnit.MINUTES)));

        reset(user.getEmail(), "123456", NEW_PASSWORD, NEW_PASSWORD)
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.message").value("El codigo expiro. Solicita uno nuevo"));
        login(user.getEmail(), OLD_PASSWORD).andExpect(status().isOk());

        // Al solicitar uno nuevo, el flujo se completa normalmente.
        String code = requestCode(user.getEmail());
        reset(user.getEmail(), code, NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void unregisteredEmailGetsTheSameAnswerAndNoCode() throws Exception {
        User user = newUser();
        String registered = mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON)
                        .content(emailJson(user.getEmail())))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String unknownEmail = "nadie." + System.nanoTime() + "@example.com";
        String unregistered = mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON)
                        .content(emailJson(unknownEmail)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        org.assertj.core.api.Assertions.assertThat(unregistered.replace(unknownEmail, "X"))
                .isEqualTo(registered.replace(user.getEmail(), "X"));
        verify(notifier, never()).sendRecoveryCode(eq(unknownEmail), anyString(), anyString(), anyLong());
    }

    @Test
    void codeCanOnlyBeUsedOnce() throws Exception {
        User user = newUser();
        String code = requestCode(user.getEmail());
        reset(user.getEmail(), code, NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isOk());

        reset(user.getEmail(), code, "OtraClave123", "OtraClave123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El codigo no es valido"));
        login(user.getEmail(), NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void newCodeInvalidatesThePreviousOne() throws Exception {
        User user = newUser();
        String first = requestCode(user.getEmail());
        String second = requestCode(user.getEmail(), 2);
        if (!first.equals(second)) {
            reset(user.getEmail(), first, NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isBadRequest());
        }
        reset(user.getEmail(), second, NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void blocksRecoveryAfterFiveWrongCodesAndWarnsTheOwner() throws Exception {
        User user = newUser();
        String code = requestCode(user.getEmail());
        String wrong = code.equals("000000") ? "111111" : "000000";
        for (int i = 0; i < 5; i++) {
            reset(user.getEmail(), wrong, NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isBadRequest());
        }

        // Ni siquiera el codigo correcto sirve mientras dura el bloqueo.
        reset(user.getEmail(), code, NEW_PASSWORD, NEW_PASSWORD)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(
                        "Demasiados codigos incorrectos. La recuperacion de contrasena fue bloqueada temporalmente. Intenta de nuevo mas tarde"));
        verify(notifier, times(1)).notifyRecoveryBlocked(eq(user.getEmail()), anyString(), eq(15L));
        org.assertj.core.api.Assertions.assertThat(
                codes.findTopByUserEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(user.getEmail())).isEmpty();
        login(user.getEmail(), OLD_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void blockAlsoAppliesToUnregisteredEmails() throws Exception {
        // Si solo se bloquearan cuentas reales, el 429 revelaria cuales correos estan registrados.
        String email = "fantasma." + System.nanoTime() + "@example.com";
        for (int i = 0; i < 5; i++) {
            reset(email, "000000", NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isBadRequest());
        }
        reset(email, "000000", NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isTooManyRequests());
    }

    @Test
    void rejectsMismatchedWeakOrReusedPasswords() throws Exception {
        User user = newUser();
        String code = requestCode(user.getEmail());

        reset(user.getEmail(), code, NEW_PASSWORD, "Distinta123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Las contrasenas no coinciden"));
        reset(user.getEmail(), code, "debil", "debil").andExpect(status().isBadRequest());
        reset(user.getEmail(), code, OLD_PASSWORD, OLD_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La nueva contrasena debe ser diferente a la actual"));

        // Los rechazos anteriores no consumen el codigo.
        reset(user.getEmail(), code, NEW_PASSWORD, NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void rejectsInvalidRequestFormat() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(emailJson("no-es-correo")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(BASE + "/verify-code").contentType(MediaType.APPLICATION_JSON)
                        .content(codeJson("cliente.demo@example.com", "12ab")))
                .andExpect(status().isBadRequest());
    }

    private String requestCode(String email) throws Exception {
        return requestCode(email, 1);
    }

    /** Pide un codigo y lo captura del correo que se habria enviado (la base solo guarda su hash). */
    private String requestCode(String email, int expectedSends) throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(emailJson(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(notifier, times(expectedSends)).sendRecoveryCode(eq(email), anyString(), code.capture(), eq(10L));
        return code.getValue();
    }

    private ResultActions reset(String email, String code, String password, String confirm) throws Exception {
        return mockMvc.perform(post(BASE + "/reset").contentType(MediaType.APPLICATION_JSON).content(
                "{\"email\":\"%s\",\"code\":\"%s\",\"newPassword\":\"%s\",\"confirmPassword\":\"%s\"}"
                        .formatted(email, code, password, confirm)));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"%s\",\"password\":\"%s\",\"recaptchaToken\":\"x\"}".formatted(email, password)));
    }

    private User newUser() {
        User user = new User("Pepe", "Perez", "recupera." + System.nanoTime() + "@example.com", "+573001112233",
                encoder.encode(OLD_PASSWORD), UserRole.CLIENTE, true);
        user.verify();
        return users.save(user);
    }

    private static String emailJson(String email) {
        return "{\"email\":\"%s\"}".formatted(email);
    }

    private static String codeJson(String email, String code) {
        return "{\"email\":\"%s\",\"code\":\"%s\"}".formatted(email, code);
    }
}
