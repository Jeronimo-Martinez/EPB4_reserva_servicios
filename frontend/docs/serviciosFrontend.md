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

### 3. Agendamiento de Citas (Reservas)

#### `POST /api/v1/bookings`
Permite a un cliente agendar una cita para un servicio específico.

Request:
```json
{
  "serviceId": "srv-01",
  "clientName": "Ana Gómez",
  "clientEmail": "ana.gomez@example.com",
  "clientPhone": "+573001234567",
  "date": "2026-09-20",
  "timeSlot": "10:00 AM",
  "notes": "Primera vez en el estudio"
}
```

Response `201 Created`:
```json
{
  "id": "res-9876",
  "serviceId": "srv-01",
  "serviceName": "Corte de Cabello y Estilo",
  "clientName": "Ana Gómez",
  "date": "2026-09-20",
  "timeSlot": "10:00 AM",
  "status": "Confirmada",
  "createdAt": "2026-09-15T21:10:00Z"
}
```

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
