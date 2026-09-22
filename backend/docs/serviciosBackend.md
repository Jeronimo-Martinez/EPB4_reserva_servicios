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

### Listar categorías

`GET /api/v1/services/categories`

Retorna un array de categorías con `code` y `label`:

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
      "category": "SALUD_Y_BIENESTAR",
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

Retorna las mismas categorías que `/api/v1/services/categories`.

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
| `businesses` | Negocios de proveedores | `id`, `user_id`, `name`, `category`, `description`, `address`, `created_at` |
| `services` | Servicios ofrecidos | `id`, `business_id`, `name`, `category`, `description`, `duration_minutes`, `price`, `available`, `created_at` |

Los identificadores son UUID. El correo es único, `role` admite `CLIENTE` o `PROVEEDOR`, y `password_hash` contiene el resultado BCrypt.

## Ejecución y verificación

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
./mvnw test
```

Estos comandos se ejecutan desde la carpeta `backend`. Desde la raíz del repositorio puede usarse `cd backend` antes de ejecutarlos.

Las pruebas cubren registro, verificación, reenvío de código, inicio de sesión exitoso, credenciales incorrectas, correo inexistente, campos vacíos, registro de proveedor y CRUD de servicios.
