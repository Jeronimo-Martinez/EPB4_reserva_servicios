# Servicios Backend

Base URL: `http://localhost:8080`

Todos los servicios reciben y devuelven JSON. Para las solicitudes POST se debe enviar el encabezado `Content-Type: application/json`.

## Flujo general

1. El cliente envía sus datos a `/api/v1/registrations`.
2. El backend valida los datos, almacena la contraseña con BCrypt y genera un código de seis dígitos.
3. El código se envía por SMTP cuando existe configuración de correo; en desarrollo se registra en el log.
4. El cliente confirma el código en `/api/v1/registrations/verify`.
5. El usuario inicia sesión en `/api/v1/auth/login` y la respuesta indica su rol y espacio de destino.

El mismo flujo aplica para proveedores con el endpoint `/api/v1/registrations/provider`.

## Formato de error

Los errores de validación y de negocio tienen este formato:

```json
{
  "status": 401,
  "message": "Correo electronico o contrasena incorrectos"
}
```

Los códigos usados son `400 Bad Request` para datos inválidos, `401 Unauthorized` para credenciales inválidas, `404 Not Found` para recursos inexistentes, `409 Conflict` para un correo ya registrado y `200 OK`/`201 Created` para operaciones exitosas.

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

## Registro de proveedor

`POST /api/v1/registrations/provider`

### Parámetros

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `firstName` | string | Sí | Máximo 100 caracteres |
| `lastName` | string | No | Máximo 100 caracteres |
| `email` | string | Sí | Debe ser un correo válido y no registrado |
| `phone` | string | Sí | Entre 7 y 20 caracteres |
| `password` | string | Sí | Mínimo 8 caracteres, una mayúscula, una minúscula y un número |
| `termsAccepted` | boolean | Sí | Debe ser `true` |
| `businessName` | string | Sí | Nombre del negocio |
| `businessCategory` | string | Sí | Categoría del negocio |
| `businessDescription` | string | No | Descripción del negocio |
| `address` | string | Sí | Dirección del negocio |

```json
{
  "firstName": "Carlos",
  "lastName": "Lopez",
  "email": "carlos@example.com",
  "phone": "+573009876543",
  "password": "Proveedor123",
  "termsAccepted": true,
  "businessName": "Centro Vital",
  "businessCategory": "SALUD_Y_BIENESTAR",
  "businessDescription": "Servicios de bienestar",
  "address": "Calle 123 #45-67"
}
```

Crea un usuario con rol `PROVEEDOR` y un registro de `Business` vinculado. Responde `201 Created` con el mismo formato que el registro de cliente. El código de verificación se envía por correo o se registra en el log.

Categorías válidas: `SALUD_Y_BIENESTAR`, `BELLEZA`, `HOGAR`, `EDUCACION`, `TECNOLOGIA`, `GASTRONOMIA`, `OTROS`.

## Reenvío de código de verificación

`POST /api/v1/registrations/resend-code`

### Parámetros

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `email` | string | Sí | Correo usado durante el registro |

```json
{
  "email": "ana.gomez@example.com"
}
```

Invalida los códigos pendientes anteriores, genera uno nuevo y lo envía. Responde `200`:

```json
{
  "message": "Se reenvio el codigo de verificacion al correo indicado",
  "email": "ana.gomez@example.com"
}
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

## Recuperación de contraseña (HU-04 / HA-04)

Endpoints públicos (sin token). Flujo de las pantallas: solicitar código → ingresar código → crear nueva contraseña → confirmación.

| Paso | Endpoint | Body |
|---|---|---|
| 1. Solicitar código | `POST /api/v1/auth/password-recovery` | `{ "email" }` |
| 2. Verificar código | `POST /api/v1/auth/password-recovery/verify-code` | `{ "email", "code" }` |
| 3. Restablecer | `POST /api/v1/auth/password-recovery/reset` | `{ "email", "code", "newPassword", "confirmPassword" }` |

**1. Solicitar código.** Siempre responde `200` con el mismo mensaje, exista o no la cuenta (no revela correos registrados):

```json
{
  "message": "Si el correo esta registrado, recibiras un codigo para crear una nueva contrasena. El codigo vence en 10 minutos",
  "email": "pepe@gmail.com"
}
```

Solo si el correo pertenece a una cuenta verificada se genera un código aleatorio de 6 dígitos, válido 10 minutos y de un solo uso, que se envía por correo de forma asíncrona (en el perfil demo se registra en el log). Pedir un código nuevo invalida el anterior.

**2. Verificar código.** Comprueba el código sin consumirlo para pasar a la pantalla de nueva contraseña. Responde `200` con `"Codigo verificado. Ya puedes crear una nueva contrasena"`.

**3. Restablecer.** Vuelve a validar el código, aplica la misma regla de contraseña que el registro y además exige que coincida con la confirmación y que sea diferente a la actual. Si todo es correcto: consume el código, cambia la contraseña, **cierra todas las sesiones abiertas**, levanta un posible bloqueo de login y envía un correo avisando del cambio. Responde `200` con `"Tu contrasena se cambio correctamente. Ya puedes iniciar sesion con la nueva contrasena"`.

Errores de los pasos 2 y 3:

| Status | Mensaje | Cuándo |
|---|---|---|
| `400` | `El codigo no es valido` | Código incorrecto, ya usado, o correo sin código (mismo mensaje para no revelar cuentas) |
| `410` | `El codigo expiro. Solicita uno nuevo` | El código es correcto pero pasaron más de 10 minutos. La interfaz debe ofrecer volver al paso 1 |
| `429` | `Demasiados codigos incorrectos. La recuperacion de contrasena fue bloqueada temporalmente. Intenta de nuevo mas tarde` | Tras 5 códigos incorrectos (HA-04) |
| `400` | `Las contrasenas no coinciden` / `La nueva contrasena debe ser diferente a la actual` / regla de contraseña | Solo en el paso 3. No consumen el código |

**Mitigaciones HA-04:** el código se guarda como hash SHA-256 y se compara en tiempo constante; tras 5 códigos incorrectos la recuperación de ese correo se bloquea 15 minutos, el código vigente se invalida y se avisa al dueño por correo. El contador también aplica a correos no registrados, para que el bloqueo no revele qué cuentas existen. Los valores se configuran con `app.password-recovery.code-minutes`, `max-attempts` y `block-minutes`. Como en el login, el contador de intentos vive en memoria y se reinicia con el servidor.

## Gestión de servicios (Proveedor)

### Crear servicio

`POST /api/v1/services`

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `providerEmail` | string | Sí | Correo del proveedor dueño del negocio |
| `name` | string | Sí | Máximo 150 caracteres |
| `category` | string | Sí | Categoría del servicio |
| `description` | string | No | Máximo 300 caracteres |
| `durationMinutes` | integer | Sí | Mayor a 0 |
| `price` | number | Sí | Mayor a 0 |
| `available` | boolean | No | Default `true` |

```json
{
  "providerEmail": "centro.vital@example.com",
  "name": "Masaje Terapéutico",
  "category": "SALUD_Y_BIENESTAR",
  "description": "Masaje para aliviar tensiones",
  "durationMinutes": 60,
  "price": 80000,
  "available": true
}
```

Responde `201 Created` con el servicio creado incluyendo `id` y `createdAt`.

### Listar servicios del proveedor

`GET /api/v1/services?providerEmail={email}`

Retorna un array de servicios pertenecientes al negocio del proveedor, ordenados por fecha de creación descendente.

### Actualizar servicio

`PUT /api/v1/services/{id}`

Mismos parámetros que crear servicio. Valida que el servicio exista y pertenezca al proveedor. Responde `200 OK` con el servicio actualizado.

### Cambiar disponibilidad

`PATCH /api/v1/services/{id}/availability`

| Campo | Tipo | Obligatorio |
|---|---|---:|
| `providerEmail` | string | Sí |
| `available` | boolean | Sí |

Responde `200 OK` con el servicio actualizado.

### Categoría del servicio

`category` acepta el código o el nombre de la categoría (`EDUCACION` o `Educacion`) y siempre se guarda el nombre, que es lo que usan el filtro del catálogo y los conteos. Una categoría que no existe responde `400`. Las categorías válidas (`GET /api/v1/catalog/categories`):

```json
[
  { "code": "SALUD_Y_BIENESTAR", "label": "Salud y Bienestar" },
  { "code": "BELLEZA", "label": "Belleza" },
  { "code": "HOGAR", "label": "Hogar" },
  { "code": "EDUCACION", "label": "Educacion" },
  { "code": "TECNOLOGIA", "label": "Tecnologia" },
  { "code": "GASTRONOMIA", "label": "Gastronomia" },
  { "code": "OTROS", "label": "Otros" }
]
```

## Catálogo público

### Buscar servicios

`GET /api/v1/catalog?search={query}&category={category}`

Parámetros opcionales de consulta. Retorna:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Masaje Terapéutico",
      "description": "...",
      "category": "Salud y Bienestar",
      "durationMinutes": 60,
      "price": 80000,
      "currency": "COP",
      "businessId": "uuid",
      "businessName": "Centro Vital",
      "businessCategory": "SALUD_Y_BIENESTAR",
      "available": true,
      "averageRating": 0,
      "reviewCount": 0
    }
  ],
  "total": 1,
  "appliedSearch": null,
  "appliedCategory": null
}
```

### Detalle de servicio

`GET /api/v1/catalog/{id}`

Retorna un solo servicio con toda su información.

### Categorías del catálogo

`GET /api/v1/catalog/categories`

Retorna el arreglo de categorías con `code` y `label` (ver *Categoría del servicio*).

## Reprogramación de reserva (HU-19)

Requieren `Authorization: Bearer {token}` de un `CLIENTE` dueño de la reserva (otro cliente recibe `403`). Solo se reprograman reservas `CONFIRMADA` cuya fecha y hora aún no pasaron. La reserva conserva su `id`, precio y estado; solo cambian `startAt` y `endAt`.

| Pantalla | Endpoint | Respuesta |
|---|---|---|
| 02 Elegir nuevo horario | `GET /api/v1/reservations/{id}/reschedule/availability?from=AAAA-MM-DD&to=AAAA-MM-DD` | Mismo formato que la disponibilidad del catálogo |
| 02 → 03 Seleccionar | `POST /api/v1/reservations/{id}/reschedule` con `{ "startAt": "2026-11-17T14:30:00Z" }` | `201` con el resumen (horario anterior y nuevo) |
| 03 Continuar | `POST /api/v1/reservations/{id}/reschedule/confirm` | `200` reserva reprogramada |
| 03 Cambiar selección / Cancelar | `DELETE /api/v1/reservations/{id}/reschedule` | `200` la reserva conserva su horario |

**Disponibilidad.** Devuelve solo los horarios realmente libres del proveedor: dentro de su horario de atención, compatibles con la duración del servicio y sin cruces con otras reservas, bloqueos temporales ni bloqueos del proveedor (HU-10). El horario propio de la reserva no cuenta como ocupado (se libera al confirmar), pero el horario actual no se ofrece. Sin horarios: `days: []` y `message: "No hay horarios disponibles"`.

**Seleccionar.** Bloquea el nuevo horario durante 10 minutos (igual que al reservar), sin tocar todavía la reserva. Respuesta:

```json
{
  "message": "Al confirmar, el horario anterior se liberara y el nuevo quedara reservado. Centro Vital recibira una notificacion con ambos horarios",
  "reservationId": "…",
  "status": "CONFIRMADA",
  "businessName": "Centro Vital",
  "serviceName": "Masaje relajante",
  "durationMinutes": 60,
  "previousStartAt": "2026-11-16T15:00:00Z",
  "previousEndAt": "2026-11-16T16:00:00Z",
  "newStartAt": "2026-11-17T14:30:00Z",
  "newEndAt": "2026-11-17T15:30:00Z",
  "holdExpiresAt": "2026-11-12T20:10:00Z"
}
```

**Confirmar.** Mueve la reserva al nuevo horario, libera el anterior y notifica al proveedor por correo con ambos horarios. Responde `"Tu reserva fue reprogramada exitosamente"` con los mismos campos (`holdExpiresAt` nulo).

**Cancelar.** Elimina el bloqueo del nuevo horario, que vuelve a quedar disponible; la reserva y su horario original no cambian. Responde `"No se aplico la reprogramacion. Tu reserva mantiene su fecha y hora originales"` con `newStartAt` nulo.

Errores:

| Status | Mensaje |
|---|---|
| `409` | `No puedes reprogramar una reserva que ya pasó` |
| `409` | `No puedes reprogramar una reserva cancelada` |
| `409` | `Solo puedes reprogramar reservas confirmadas` |
| `409` | `El horario seleccionado ya no esta disponible` |
| `409` | `No hay un cambio de horario pendiente. Selecciona un nuevo horario` (confirmar sin haber seleccionado) |
| `400` | `Selecciona un horario diferente al actual`, `La fecha y la hora deben ser futuras` o fuera del horario de atención |
| `410` | `El tiempo para confirmar el cambio expiro. Selecciona nuevamente la fecha y la hora` |

## Perfil del negocio (HU-06)

Solo rol `PROVEEDOR`; el negocio sale del token, así que nadie edita uno ajeno.

`GET /api/v1/business/profile` → `200 { message, businessId, name, category, description, address, phone, email }`.

`PUT /api/v1/business/profile`

| Campo | Regla |
|---|---|
| `name` | Obligatorio, 2–150 caracteres |
| `category` | Una categoría del catálogo, por etiqueta (`"Salud y Bienestar"`) o clave (`"SALUD_Y_BIENESTAR"`); se guarda como etiqueta. La categoría actual se acepta tal cual |
| `description` | Opcional, máx. 300 |
| `address` | Obligatoria, máx. 255 |
| `phone` | Obligatorio, formato `+57 300 555 1234` (es el teléfono de la cuenta del proveedor) |

Responde `200` con `message: "Perfil del negocio actualizado correctamente"`. Cualquier dato inválido responde `400` con el motivo y no guarda nada. El **correo** es de solo lectura: no está en el cuerpo y, si se envía, se ignora. Los cambios se ven de inmediato en `GET /api/v1/catalog/businesses/{id}`.

## Historial de reservas del proveedor (HU-22)

`GET /api/v1/schedule/history?status=ESTADO` (solo `PROVEEDOR`; `status` opcional: `CONFIRMADA`, `ATENDIDA`, `NO_ASISTIO`, `CANCELADA`; otro valor → `400 "Estado de reserva no valido"`).

```json
{
  "status": null,
  "message": null,
  "total": 1,
  "reservations": [
    { "id": "…", "code": "R-1A2B", "startAt": "2026-11-18T15:00:00Z", "endAt": "2026-11-18T16:00:00Z",
      "clientName": "Laura Gomez", "serviceName": "Masaje relajante", "durationMinutes": 60, "status": "CONFIRMADA" }
  ]
}
```

Lista las reservas del negocio de la más reciente a la más antigua, sin bloqueos temporales (`PENDIENTE`) ni reservas de otros negocios. Vacía: `message` = `"Aun no hay reservas en el historial"` (sin filtro) o `"No hay reservas con ese estado"`. Los estados `ATENDIDA` y `NO_ASISTIO` se añadieron al modelo para el historial; todavía nada los asigna (HU de registro de asistencia pendiente).

## Datos de muestra

Para probar sin PostgreSQL, iniciar con el perfil `demo`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

El perfil usa H2 en memoria. El usuario de muestra recomendado es `cliente.demo@example.com` con contrasena `Cliente123`. Sin configuracion SMTP, `LoggingVerificationCodeSender` registra el codigo en el log. Para envio real configure `spring.mail.host`, `spring.mail.port`, `spring.mail.username`, `spring.mail.password` y las propiedades TLS/autenticacion de su proveedor; entonces se activa automaticamente `MailVerificationCodeSender`.

### Usuarios demo

| Campo | Cliente | Proveedor |
|---|---|---|
| Nombre | Ana Gomez | Centro Vital |
| Correo | `cliente.demo@example.com` | `centro.vital@example.com` |
| Contraseña | `Cliente123` | `Proveedor123` |
| Rol | `CLIENTE` | `PROVEEDOR` |

## Persistencia utilizada

| Tabla | Propósito | Campos principales |
|---|---|---|
| `users` | Usuarios clientes/proveedores | `id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `role`, `terms_accepted`, `is_verified`, `created_at` |
| `verification_codes` | Códigos de activación | `id`, `user_id`, `code`, `expires_at`, `is_used` |
| `password_reset_codes` | Códigos de recuperación de contraseña | `id`, `user_id`, `code_hash`, `expires_at`, `is_used`, `created_at` |
| `businesses` | Negocios de proveedores | `id`, `user_id`, `name`, `category`, `description`, `address`, `created_at` |
| `services` | Servicios ofrecidos | `id`, `business_id`, `name`, `category`, `description`, `duration_minutes`, `price`, `available`, `created_at` |

Los identificadores son UUID. El correo es único, `role` admite `CLIENTE` o `PROVEEDOR`, y `password_hash` contiene el resultado BCrypt.

## Ejecución y verificación

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
./mvnw test
```

Estos comandos se ejecutan desde la carpeta `backend`. Desde la raíz del repositorio puede usarse `cd backend` antes de ejecutarlos.

Las pruebas cubren registro, verificación, reenvío de código, inicio de sesión exitoso, credenciales incorrectas, correo inexistente, campos vacíos, registro de proveedor, CRUD de servicios y recuperación de contraseña (código correcto, incorrecto, vencido, de un solo uso, correo no registrado y bloqueo por intentos).
