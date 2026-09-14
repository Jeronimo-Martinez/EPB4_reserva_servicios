# Estructura de Datos Mínima para ProMarket

Esta estructura de datos relacional mínima cubre todos los requerimientos funcionales descritos en las historias de usuario (**HU-01**, **HU-02**, **HU-03**, **HU-07**) y las pantallas del diseño (mockups).

---

## 1. Tabla: `users` (Usuarios del sistema)
Maneja la autenticación unificada para clientes y proveedores (**HU-01**, **HU-02**, **HU-03**).

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PK, Auto-increment | Identificador único del usuario |
| `first_name` | VARCHAR(100) | NOT NULL | Nombres |
| `last_name` | VARCHAR(100) | NULLABLE | Apellidos (opcional según el tipo de registro) |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Correo de acceso e identificación |
| `phone` | VARCHAR(20) | NOT NULL | Número telefónico |
| `password_hash` | VARCHAR(255) | NOT NULL | Contraseña encriptada |
| `role` | ENUM | 'CLIENTE', 'PROVEEDOR' | Define el tipo de cuenta para la redirección (**HU-03**) |
| `terms_accepted` | BOOLEAN | NOT NULL | Confirmación de aceptación de términos y políticas |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Estado de verificación por código |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de registro |

---

## 2. Tabla: `verification_codes` (Códigos de activación)
Gestiona la verificación por correo electrónico y reenvíos (**HU-01**, **HU-02**).

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PK, Auto-increment | Identificador único del registro |
| `user_id` | UUID / INT | FK -> `users.id` | Usuario asociado |
| `code` | VARCHAR(6) | NOT NULL | Código numérico o alfanumérico enviado |
| `expires_at` | TIMESTAMP | NOT NULL | Tiempo de expiración del código |
| `is_used` | BOOLEAN | DEFAULT FALSE | Bandera para evitar reuso |

---

## 3. Tabla: `businesses` (Negocios / Perfil Proveedor)
Almacena la información específica del negocio para los usuarios con rol `PROVEEDOR` (**HU-02** y mockup de registro de negocio).

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PK, Auto-increment | Identificador único del negocio |
| `user_id` | UUID / INT | FK -> `users.id`, UNIQUE | Propietario del negocio (1 a 1) |
| `name` | VARCHAR(150) | NOT NULL | Nombre comercial del negocio |
| `category` | VARCHAR(100) | NOT NULL | Categoría del negocio (ej. Salud y Bienestar) |
| `description` | VARCHAR(300) | NULLABLE | Resumen de servicios (máx 300 caracteres según mockup) |
| `address` | VARCHAR(255) | NOT NULL | Dirección física de atención |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de creación del perfil comercial |

---

## 4. Tabla: `services` (Catálogo de servicios)
Registra la oferta que los proveedores configuran para sus clientes (**HU-07** y mockups "Mis Servicios" y "Agregar nuevo servicio").

| Campo | Tipo de Dato | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | UUID / INT | PK, Auto-increment | Identificador único del servicio |
| `business_id` | UUID / INT | FK -> `businesses.id` | Negocio que ofrece el servicio |
| `name` | VARCHAR(150) | NOT NULL | Nombre del servicio |
| `category` | VARCHAR(100) | NOT NULL | Categoría específica del servicio |
| `description` | VARCHAR(300) | NULLABLE | Detalle del servicio (máx 300 caracteres) |
| `duration_minutes` | INT | NOT NULL, CHECK (> 0) | Duración expresada en minutos para cálculo de agendas |
| `price` | DECIMAL(10,2) | NOT NULL, CHECK (> 0) | Precio unitario del servicio |
| `is_available` | BOOLEAN | DEFAULT TRUE | Interruptor "Disponible para clientes" (según mockup) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de alta del servicio |
