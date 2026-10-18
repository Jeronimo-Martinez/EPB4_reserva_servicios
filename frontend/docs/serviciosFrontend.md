# Servicios y Arquitectura Frontend

Base API URL: `http://localhost:8080/api/v1` (configurable vía la variable `VITE_API_BASE_URL` en `.env`).

El frontend de ProMarket está construido con **React 19**, **TypeScript**, **Tailwind CSS v4** y **Vite**. La interfaz se comunica con el backend mediante peticiones HTTP en formato JSON (`Content-Type: application/json`).

---

## Flujo general de la aplicación

1. **Visitante / Landing:** El usuario explora categorías de servicios y visualiza profesionales destacados. Puede acceder al catálogo libremente o iniciar el flujo de autenticación.
2. **Registro y Verificación:**
   - **Cliente:** Se registra con nombre, teléfono, correo y contraseña segura. Al recibir el código por correo, lo confirma y queda habilitado para agendar citas.
   - **Proveedor:** Registra además los datos de su negocio (nombre comercial, categoría, descripción).
3. **Inicio de sesión y redirección:** Al autenticarse exitosamente en `/api/v1/auth/login`, el backend devuelve el rol (`CLIENTE` o `PROVEEDOR`), dirigiendo la interfaz al espacio respectivo.
4. **Catálogo y Reserva (Cliente):** El cliente filtra servicios por categoría o término, selecciona un servicio disponible y agenda su cita especificando fecha, hora y notas.
5. **Gestión de Servicios (Proveedor):** El proveedor administra su catálogo de servicios (crear, editar, activar/pausar disponibilidad y eliminar).

---

## Estructura del proyecto frontend

```text
frontend/
├── docs/
│   └── serviciosFrontend.md       Documentación técnica y contratos de integración
├── public/                        Recursos estáticos e iconos
├── src/
│   ├── api/                       Clientes HTTP y contratos para el backend
│   │   ├── client.ts              Configuración de fetch/Axios y manejo de errores
│   │   ├── auth.ts                Servicios de login, registro y verificación
│   │   └── services.ts            Servicios de catálogo, reservas y CRUD
│   ├── components/
│   │   ├── layout/                NavBar, SideNav, ProMarketLogo, Footer
│   │   └── ui/                    Componentes atómicos (EmptyState, InputField, SelectField, etc.)
│   ├── context/
│   │   └── AuthContext.tsx        Estado global de sesión, navegación y alertas (toasts)
│   ├── features/
│   │   ├── auth/                  InicioSesion, RegistroCliente, RegistroProveedor
│   │   ├── cliente/               CatalogoServicios, MisReservas, Modal de Reserva
│   │   ├── perfil/                PerfilUsuario (edición de datos personales)
│   │   └── servicios/             GestionServicios, FormServicio, ServicioCard
│   ├── pages/
│   │   └── Landing.tsx            Página de aterrizaje comercial
│   ├── types/                     Modelos e interfaces TypeScript (auth, service)
│   ├── App.tsx                    Enrutador principal de la aplicación
│   ├── index.css                  Estilos globales y diseño del sistema de diseño
│   └── main.tsx                   Punto de entrada de React
├── .env.example                   Plantilla de variables de entorno
├── package.json                   Dependencias y scripts
├── tsconfig.json                  Configuración estricta de TypeScript
└── vite.config.ts                 Configuración del bundler Vite y aliases (@)
```

---

## Contratos de integración con el Backend

### Sesión y permisos (HUS-29, HA-29)

- `POST /api/v1/auth/login` y `POST /api/v1/registrations/verify` devuelven un `token`. `AuthContext` lo guarda con el usuario y `src/api/client.ts` lo envía en cada petición como `Authorization: Bearer <token>`.
- **El backend identifica al usuario solo por el token**: ninguna petición lleva `providerEmail` ni `clientEmail`, y los datos que el navegador envíe nunca deciden permisos.
- Permisos por rol: catálogo, negocios, registro y login son públicos; servicios, horarios y agenda son solo para `PROVEEDOR`; reservas solo para `CLIENTE`. `navigate()` aplica la misma regla en la interfaz.
- `401`: no hay sesión o ya no es válida. Si había un token guardado, la app cierra la sesión y muestra *"Tu sesión terminó. Inicia sesión de nuevo."*.
- `403`: el recurso es de otro usuario (*"No tienes permitido acceder a esta información"* / *"…editar esta información"*) o la función es de otro rol. Cada intento queda en el log `AUDIT` del backend; con 5 intentos en 15 minutos se cierran las sesiones de la cuenta y queda bloqueada 15 minutos.
- `POST /api/v1/auth/logout` invalida el token en el backend (lo usa **Cerrar sesión**).

Para las personas encargadas del backend, esta sección describe los endpoints y formatos de datos que el frontend consume actualmente o espera en las fases de integración:

### 1. Autenticación y Cuentas

#### `POST /api/v1/registrations`
Envío de datos para el alta de un nuevo cliente o proveedor.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---:|---|
| `firstName` | string | Sí | Nombre del usuario (máx 100 car.) |
| `lastName` | string | No | Apellido del usuario |
| `email` | string | Sí | Correo electrónico válido y único |
| `phone` | string | Sí | Entre 7 y 20 caracteres |
| `password` | string | Sí | Mín. 8 caracteres, 1 mayúscula, 1 número |
| `role` | string | No | `"CLIENTE"` o `"PROVEEDOR"` (por defecto `CLIENTE`) |
| `businessName` | string | No | Obligatorio si `role === "PROVEEDOR"` |
| `businessCategory` | string | No | Obligatorio si `role === "PROVEEDOR"` |
| `termsAccepted` | boolean | Sí | Debe ser `true` |

Request:
```json
{
  "firstName": "Ana",
  "lastName": "Gomez",
  "email": "ana.gomez@example.com",
  "phone": "+573001234567",
  "password": "Cliente123",
  "role": "CLIENTE",
  "termsAccepted": true
}
```

Response `201 Created`:
```json
{
  "message": "Se envio un codigo de verificacion al correo indicado",
  "email": "ana.gomez@example.com",
  "verificationRequired": true
}
```

---

#### `POST /api/v1/registrations/verify`
Confirmación del código de 6 dígitos enviado al correo del usuario.

Request:
```json
{
  "email": "ana.gomez@example.com",
  "code": "123456"
}
```

Response `200 OK`:
```json
{
  "message": "Registro verificado exitosamente",
  "email": "ana.gomez@example.com",
  "role": "CLIENTE"
}
```

---

#### `POST /api/v1/auth/login`
Autenticación de usuarios clientes y proveedores.

Request:
```json
{
  "email": "cliente.demo@example.com",
  "password": "Cliente123"
}
```

Response `200 OK`:
```json
{
  "message": "Inicio de sesion exitoso",
  "email": "cliente.demo@example.com",
  "role": "CLIENTE",
  "redirectTo": "/cliente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

---

### 2. Catálogo y Servicios de Proveedores (Futura Integración Backend)

#### `GET /api/v1/services`
Obtiene la lista pública de servicios disponibles para el catálogo. Admite filtros opcionales por categoría y búsqueda textual.

Parámetros query opcionales: `category`, `search`, `page`, `limit`.

Response `200 OK`:
```json
[
  {
    "id": "srv-01",
    "businessId": "biz-01",
    "businessName": "Studio Glamour",
    "name": "Corte de Cabello y Estilo",
    "description": "Corte personalizado con lavado premium y asesoría de imagen.",
    "category": "Belleza y Estética",
    "price": 55000,
    "currency": "COP",
    "durationMinutes": 45,
    "isAvailable": true,
    "rating": 4.9,
    "reviewsCount": 28
  }
]
```

---

#### `POST /api/v1/services` (Solo rol `PROVEEDOR`)
Permite a un profesional publicar un nuevo servicio en su catálogo.

Request:
```json
{
  "name": "Sesión de Fisioterapia Deportiva",
  "category": "Salud y Bienestar",
  "description": "Evaluación postural y tratamiento de lesiones musculares.",
  "durationMinutes": 60,
  "price": 120000,
  "currency": "COP",
  "isAvailable": true
}
```

Response `201 Created`:
```json
{
  "id": "srv-05",
  "name": "Sesión de Fisioterapia Deportiva",
  "category": "Salud y Bienestar",
  "description": "Evaluación postural y tratamiento de lesiones musculares.",
  "durationMinutes": 60,
  "price": 120000,
  "currency": "COP",
  "isAvailable": true,
  "createdAt": "2026-09-15T20:00:00Z"
}
```

---

### 2.1 Negocios (HU-13)

Pantallas `src/features/negocios/ResultadosNegocios.tsx` (enlace **Negocios** en la barra superior) y `DetalleNegocio.tsx` (al elegir un negocio en los resultados o su nombre en una tarjeta del catálogo, con `openBusiness` de `AuthContext`). En el detalle, **Reservar** abre el modal `IniciarReservaModal` (también lo usa "Reservar cita" del catálogo) y **Elegir fecha y hora** continúa a la reserva. Los servicios pausados muestran "No disponible por el momento" con el botón deshabilitado.

#### `GET /api/v1/catalog/businesses?search=...`
Negocios cuyo nombre, categoría, descripción, dirección o alguno de sus servicios contiene el término (sin distinguir mayúsculas). Sin `search` devuelve todos. Cada elemento tiene el mismo formato del detalle.

#### `GET /api/v1/catalog/businesses/{id}`
```json
{
  "id": "…", "name": "Centro Vital", "category": "Salud y Bienestar",
  "description": "Centro integral de servicios de salud, belleza y bienestar personal.",
  "address": "Cra 43A #1-50, Medellin", "phone": "+573001112233", "email": "centro.vital@example.com",
  "averageRating": 0, "reviewCount": 0,
  "services": [{ "id": "…", "name": "Corte de Cabello Clasico", "durationMinutes": 45, "price": 35000, "available": true, "…": "…" }]
}
```
`available` es `true` solo si el servicio está activo **y** el negocio tiene horario de atención. Mientras no existan reseñas, la calificación se muestra como "Sin reseñas aún".

---

### 3. Reserva de Citas (HU-14, HU-15 y HU-16)

Pantalla `src/features/reservas/ReservarCita.tsx`. Se abre con **Reservar cita** en el catálogo (`startBooking` en `AuthContext`); sin sesión, lleva al inicio de sesión. Tiene tres pasos: selección de servicio, fecha y hora → revisión con el tiempo restante del bloqueo → reserva confirmada. Las llamadas están en `src/api/services.ts` (negocio y disponibilidad) y `src/api/reservations.ts` (bloqueo y confirmación).

#### `GET /api/v1/catalog/businesses/{businessId}`
Datos del negocio y sus servicios; alimenta el selector **Servicio** (solo servicios disponibles).

#### `GET /api/v1/catalog/{serviceId}/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`
Cupos libres (máximo 31 días por consulta; la pantalla pide 4 semanas desde hoy). Solo incluye días con cupos; cada cupo es el instante UTC de inicio y ya excluye reservas, bloqueos temporales y horarios fuera de atención. Si no hay cupos, `message` = "El servicio no tiene disponibilidad proxima".

```json
{ "serviceId": "…", "durationMinutes": 30, "timeZone": "America/Bogota", "message": null,
  "days": [{ "date": "2026-10-19", "slots": ["2026-10-19T13:00:00Z", "2026-10-19T13:30:00Z"] }] }
```

#### `POST /api/v1/reservations/holds`
Bloquea el horario por 10 minutos (botón **Continuar**). Responde `201` con la reserva `PENDIENTE` y `holdExpiresAt`; `409` si otro cliente ya tomó el horario (la pantalla muestra el aviso y recarga los cupos).

```json
{ "serviceId": "…", "startAt": "2026-10-19T13:00:00Z" }
```

#### `POST /api/v1/reservations/{id}/confirm`
Confirma la reserva (botón **Confirmar reserva**), sin cuerpo. Responde `200` con `status: "CONFIRMADA"`; `410` si el bloqueo expiró (la pantalla vuelve a la selección de fecha y hora con un aviso) y `409` si ya estaba confirmada.

---

### 4. Horario de Atención del Proveedor (HU-09)

Pantalla `src/features/horarios/HorarioAtencion.tsx`, accesible desde **Agenda y Disponibilidad** en la barra superior o **Horarios** en el panel lateral del proveedor. Las llamadas están en `src/api/schedule.ts`.

#### `GET /api/v1/schedule/hours`
Devuelve los días configurados. Si la lista está vacía, la pantalla muestra lunes a sábado activos sin horas, como en el mockup. Responde `404` si el proveedor no tiene negocio.

Response `200 OK`:
```json
{
  "message": null,
  "timeZone": "America/Bogota",
  "days": [{ "dayOfWeek": "MONDAY", "startTime": "08:00:00", "endTime": "18:00:00" }]
}
```

#### `PUT /api/v1/schedule/hours`
Reemplaza el horario completo: los días que no se envían quedan sin atención.

Request:
```json
{
  "days": [{ "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "17:00" }]
}
```

Responde `200` con el mismo formato del `GET` y `"message": "Horario guardado exitosamente"`, o `400` si no hay días, falta una hora, la hora de inicio no es anterior a la de cierre o un día se repite. La pantalla valida las mismas reglas antes de enviar para marcar el día con error.

---

### 5. Agenda del Proveedor (HU-11)

Pantalla `src/features/agenda/AgendaNegocio.tsx`, accesible desde **Agenda y Disponibilidad** en la barra superior o **Agenda** en el panel lateral (`ProviderAside`, compartido por todas las páginas del proveedor). Abre en la vista **Día**; la semana oculta los días sin atención que no tienen reservas y el mes muestra las reservas de cada día. Al seleccionar una reserva se abre el panel de detalle (se cierra con la X, `Esc` o clic fuera).

#### `GET /api/v1/schedule/agenda?view=DIA|SEMANA|MES&date=YYYY-MM-DD`
`date` es cualquier día del periodo: la semana empieza el lunes y el mes el día 1. Las horas llegan en UTC y la pantalla las muestra en hora de Bogotá.

Response `200 OK`:
```json
{
  "view": "SEMANA",
  "from": "2026-10-19",
  "to": "2026-10-25",
  "timeZone": "America/Bogota",
  "message": null,
  "days": [
    {
      "date": "2026-10-19",
      "openTime": "08:00:00",
      "closeTime": "18:00:00",
      "reservations": [
        {
          "id": "be496ab9-...",
          "clientName": "Cliente Demo",
          "clientEmail": "cliente.demo@example.com",
          "clientPhone": "+573001234567",
          "serviceName": "Masaje Descontracturante",
          "startAt": "2026-10-19T14:00:00Z",
          "endAt": "2026-10-19T15:00:00Z",
          "durationMinutes": 60,
          "status": "CONFIRMADA"
        }
      ]
    }
  ]
}
```

`openTime`/`closeTime` son `null` si el negocio no atiende ese día. `status: "PENDIENTE"` es un bloqueo temporal mientras otro cliente completa su reserva y se muestra como **Bloqueado**. Si no hay reservas, `message` trae "No tienes reservas programadas en este periodo".

---

## Gestión de Estados Vacíos (Empty States)

El frontend incluye el componente estandarizado `EmptyState` (`src/components/ui/EmptyState.tsx`) para gestionar limpiamente las respuestas vacías del backend:

1. **Catálogo sin resultados de búsqueda:** Muestra un icono de búsqueda con la recomendación de usar otros términos o presionar *"Restablecer filtros"*.
2. **Catálogo global vacío:** Si la base de datos no tiene servicios registrados (`services = []`), informa de forma amigable que los profesionales están publicando sus servicios.
3. **Mis Reservas vacío:** Si el usuario no tiene citas agendadas (`bookings = []`), presenta una llamada a la acción hacia *"Explorar catálogo de servicios"*.
4. **Panel de Proveedor sin servicios:** Muestra una tarjeta con borde punteado invitando a *"Crear mi primer servicio"*.

---

## Datos de Muestra y Modo Mock (Desarrollo Frontend)

Para desarrollar y probar de forma independiente al backend, el frontend cuenta con adaptadores mock en `src/api/` y `localStorage`:

### Cuentas Demo disponibles

| Rol | Correo de Acceso | Contraseña | Espacio Destino |
|---|---|---|---|
| **Cliente** | `cliente.demo@example.com` | `Cliente123` | Catálogo / Mis Reservas |
| **Proveedor** | `proveedor.demo@example.com` | `Proveedor123` | Panel Gestión de Servicios |

---

## Ejecución y Verificación

Desde el directorio `frontend/`:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo con Hot Reload (puerto 5173 por defecto)
npm run dev

# 3. Compilar para producción y validar TypeScript
npm run build

# 4. Previsualizar compilación de producción localmente
npm run preview
```
