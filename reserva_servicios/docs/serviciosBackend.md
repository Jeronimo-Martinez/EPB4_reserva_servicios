# Servicios Backend

Base URL: `http://localhost:8080`

Todos los servicios reciben y devuelven JSON. Para las solicitudes POST se debe enviar el encabezado `Content-Type: application/json`.

## Flujo general

1. El cliente envía sus datos a `/api/v1/registrations`.
2. El backend valida los datos, almacena la contraseña con BCrypt y genera un código de seis dígitos.
3. El código se envía por SMTP cuando existe configuración de correo; en desarrollo se registra en el log.
4. El cliente confirma el código en `/api/v1/registrations/verify`.
5. El usuario inicia sesión en `/api/v1/auth/login` y la respuesta indica su rol y espacio de destino.

## Formato de error

Los errores de validación y de negocio tienen este formato:

```json
{
  "status": 401,
  "message": "Correo electronico o contrasena incorrectos"
}
```

Los códigos usados son `400 Bad Request` para datos inválidos, `401 Unauthorized` para credenciales inválidas, `409 Conflict` para un correo ya registrado y `200 OK`/`201 Created` para operaciones exitosas.

## Registro de cliente

`POST /api/v1/registrations`

### Parámetros

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `firstName` | string | Sí | Máximo 100 caracteres |
| `lastName` | string | No | Máximo 100 caracteres |
| `email` | string | Sí | Debe ser un correo válido y no registrado |
| `phone` | string | Sí | Entre 7 y 20 caracteres numéricos, espacios, `+`, paréntesis o guiones |
| `password` | string | Sí | Mínimo 8 caracteres, una mayúscula, una minúscula y un número |
| `termsAccepted` | boolean | Sí | Debe ser `true` |

```json
{
  "firstName": "Ana",
  "lastName": "Gomez",
  "email": "ana.gomez@example.com",
  "phone": "+573001234567",
  "password": "Cliente123",
  "termsAccepted": true
}
```

La contrasena debe tener minimo 8 caracteres, una mayuscula, una minuscula y un numero. Responde `201 Created`; el codigo se envia mediante el componente de notificacion y expira en 15 minutos.

Response `201`:

```json
{
  "message": "Se envio un codigo de verificacion al correo indicado",
  "email": "ana.gomez@example.com",
  "verificationRequired": true
}
```

Responde `400` por datos invalidos, terminos no aceptados o contrasena debil; `409` si el correo ya existe.

Ejemplo con cURL:

```bash
curl -X POST http://localhost:8080/api/v1/registrations -H "Content-Type: application/json" -d "{\"firstName\":\"Ana\",\"lastName\":\"Gomez\",\"email\":\"ana.gomez@example.com\",\"phone\":\"+573001234567\",\"password\":\"Cliente123\",\"termsAccepted\":true}"
```

## Verificar registro

`POST /api/v1/registrations/verify`

### Parámetros

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `email` | string | Sí | Correo usado durante el registro |
| `code` | string | Sí | Exactamente seis dígitos, vigente y no utilizado |

Request:

```json
{
  "email": "ana.gomez@example.com",
  "code": "123456"
}
```

Response `200`: `{ "message": "Registro verificado exitosamente", "email": "ana.gomez@example.com", "role": "CLIENTE" }`

Un codigo incorrecto, usado o expirado responde `400`.

Ejemplo con cURL:

```bash
curl -X POST http://localhost:8080/api/v1/registrations/verify -H "Content-Type: application/json" -d "{\"email\":\"ana.gomez@example.com\",\"code\":\"123456\"}"
```

## Inicio de sesion

`POST /api/v1/auth/login`

### Parámetros

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `email` | string | Sí | Debe estar registrado |
| `password` | string | Sí | Debe coincidir con la contraseña registrada |

Request:

```json
{
  "email": "cliente.demo@example.com",
  "password": "Cliente123"
}
```

Response `200`:

```json
{
  "message": "Inicio de sesion exitoso",
  "email": "cliente.demo@example.com",
  "role": "CLIENTE",
  "redirectTo": "/cliente"
}
```

`role` identifica el tipo de cuenta (`CLIENTE` o `PROVEEDOR`) y `redirectTo` indica el espacio al que debe dirigir la interfaz. Un correo no registrado o una contrasena incorrecta responde `401` con el mensaje `Correo electronico o contrasena incorrectos`. Los campos vacios o con formato invalido responden `400`.

Ejemplo con cURL:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"cliente.demo@example.com\",\"password\":\"Cliente123\"}"
```

## Datos de muestra

Para probar sin PostgreSQL, iniciar con el perfil `demo`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

El perfil usa H2 en memoria. El usuario de muestra recomendado es `cliente.demo@example.com` con contrasena `Cliente123`. Sin configuracion SMTP, `LoggingVerificationCodeSender` registra el codigo en el log. Para envio real configure `spring.mail.host`, `spring.mail.port`, `spring.mail.username`, `spring.mail.password` y las propiedades TLS/autenticacion de su proveedor; entonces se activa automaticamente `MailVerificationCodeSender`.

### Usuario demo

| Campo | Valor |
|---|---|
| Nombre | Cliente |
| Apellido | Demo |
| Correo | `cliente.demo@example.com` |
| Teléfono | `+573001234567` |
| Contraseña de prueba | `Cliente123` |
| Rol | `CLIENTE` |
| Verificado | Sí |

Este usuario se crea automáticamente solo con el perfil `demo`. En PostgreSQL, los usuarios se crean mediante el endpoint de registro y no se almacenan contraseñas en texto plano.

## Persistencia utilizada

| Tabla | Propósito | Campos principales |
|---|---|---|
| `users` | Usuarios clientes/proveedores | `id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `role`, `terms_accepted`, `is_verified`, `created_at` |
| `verification_codes` | Códigos de activación | `id`, `user_id`, `code`, `expires_at`, `is_used` |

Los identificadores son UUID. El correo es único, `role` admite `CLIENTE` o `PROVEEDOR`, y `password_hash` contiene el resultado BCrypt. Las tablas `businesses` y `services` están contempladas en el diseño de datos, pero todavía no tienen servicios REST implementados.

## Ejecución y verificación

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
./mvnw test
```

Las pruebas cubren registro, verificación, inicio de sesión exitoso, credenciales incorrectas, correo inexistente y campos vacíos.