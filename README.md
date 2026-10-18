# EPB4_reserva_servicios

## Estructura del repositorio

```text
backend/       API Spring Boot, persistencia, seguridad, pruebas y documentación
frontend/      Aplicación web cliente y proveedor
backend/postman/ Colecciones y recursos para probar la API
```

## Ejecutar el backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

La API queda disponible en `http://localhost:8080`. Si el puerto está ocupado, usa:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo" "-Dspring-boot.run.arguments=--server.port=8081"
```

La documentación de endpoints está en [backend/docs/serviciosBackend.md](backend/docs/serviciosBackend.md).

El perfil `demo` usa H2 en memoria con un proveedor de ejemplo, "Centro Vital" (`centro.vital@example.com` / `Proveedor123`), y un cliente (`cliente.demo@example.com` / `Cliente123`).

## Conectar con Supabase (PostgreSQL)

1. En Supabase, abre el proyecto y pulsa **Connect** → pestaña **Session pooler** (la conexión directa solo funciona por IPv6).
2. Copia `backend/.env.example` como `backend/.env` y completa `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` con esos datos. `.env` está en `.gitignore`: nunca lo subas.
3. Ejecuta sin perfil, desde la carpeta `backend`: `.\mvnw.cmd spring-boot:run`. Hibernate crea las tablas la primera vez.
4. Una sola vez, en **Project Settings → Data API**, desactiva la Data API (el backend no la usa). Así las tablas no quedan expuestas a la API REST pública de Supabase.

Sin `.env`, el backend usa el PostgreSQL local (`localhost:5432/reserva_servicios_db`).

Si al arrancar aparece `Read timed out` o `Connection reset`, la red bloquea el puerto 5432: usa el puerto `6543` y añade `&prepareThreshold=0` al final de `DB_URL` (ver `backend/.env.example`).

## Desplegar el backend en Render

1. Sube a GitHub la rama que se va a desplegar. Render necesita acceso al repositorio, así que el servicio lo crea el dueño del repo o alguien con permisos de administrador.
2. En Render: **New → Web Service** → elige el repositorio y la rama, y configura:
   - **Root Directory:** `backend`
   - **Language:** `Docker` (usa `backend/Dockerfile`)
   - **Instance Type:** `Free`
   - **Health Check Path** (en *Advanced*): `/api/v1/catalog/categories`
3. En **Environment** agrega estas variables:

   | Variable | Valor |
   |---|---|
   | `DB_URL` | La misma de tu `backend/.env` |
   | `DB_USERNAME` | La misma de tu `backend/.env` |
   | `DB_PASSWORD` | La misma de tu `backend/.env` |
   | `APP_CORS_ALLOWED_ORIGINS` | URL del frontend, separadas por comas. Ej: `https://promarket.vercel.app,http://localhost:5173`. Acepta comodines como `https://promarket-*.vercel.app` para las vistas previas de Vercel |
   | `SPRING_JPA_SHOW_SQL` | `false` |
   | `RECAPTCHA_SECRET_KEY` | Clave secreta de reCAPTCHA (del mismo par que `VITE_RECAPTCHA_SITE_KEY` en Vercel) |
   | `APP_MAIL_ENABLED` | `true` para enviar correos; con `false` los códigos solo aparecen en los logs |
   | `BREVO_API_KEY` | API key de Brevo (ver abajo). Render gratuito bloquea SMTP, así que allí el correo sale por esta API |
   | `MAIL_FROM` | Correo remitente verificado en Brevo |

   **Correo con Brevo (gratis, unos 300 correos al día):** crea una cuenta en [brevo.com](https://www.brevo.com), verifica tu correo como remitente en **Senders, Domains & Dedicated IPs → Senders**, y crea la clave en **SMTP & API → API Keys** (es la que empieza por `xkeysib-`, no la de SMTP). Sin dominio propio Brevo puede mostrar otra dirección como remitente y algunos correos pueden llegar a spam. En local puedes seguir usando Gmail por SMTP (ver `backend/.env.example`).

4. Pulsa **Deploy** y comprueba `https://<tu-servicio>.onrender.com/api/v1/catalog`.

En el plan gratuito el servicio se duerme tras unos 15 minutos sin uso y arrancar de nuevo tarda unos 2 minutos: ábrelo antes de una demo.

## Autenticación y permisos

El login y la verificación del registro devuelven un token de sesión (válido 12 horas, `app.session.hours`). Todas las rutas protegidas lo exigen en `Authorization: Bearer <token>`, y el backend identifica al usuario solo por ese token. Servicios, horarios y agenda son de `PROVEEDOR`; reservas de `CLIENTE`. Los accesos denegados quedan en el log `AUDIT` y, tras 5 intentos en 15 minutos, la cuenta se bloquea temporalmente.

## Validar el backend

```powershell
cd backend
.\mvnw.cmd test
```

## Ejecutar el frontend

```powershell
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`. La documentación de la aplicación cliente está en [frontend/docs/serviciosFrontend.md](frontend/docs/serviciosFrontend.md).

## Validar el frontend

```powershell
cd frontend
npm run build
```
