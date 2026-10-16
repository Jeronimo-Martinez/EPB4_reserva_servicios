# reCAPTCHA v2 Checkbox — Cambios del Frontend (guía de re-integración)

> Si en una integración/fusión se pierden los cambios del front, este documento permite
> re-aplicarlos paso a paso. Stack: React 19 + Vite 8 + Tailwind 4, sin librerías extra
> (se usa el script oficial de Google con render explícito).

Fecha: 2026-10-13 · Rama: `feature/reCaptcha` · Versión: **v2 Checkbox, siempre obligatorio**
en `InicioSesion` (login), `RegistroCliente` y `RegistroProveedor` (paso 2).

---

## 0. Claves y configuración (requisito)

1. Consola Google reCAPTCHA → claves v2 Checkbox + agregar `localhost:3000` en Dominios.
2. Crear `frontend/.env` (no se commitea) con:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_RECAPTCHA_SITE_KEY=6Lc...  # SITE KEY pública
   ```
   Ver `frontend/.env.example` (este archivo SÍ se commitea y ya incluye la variable).
3. Sin `VITE_RECAPTCHA_SITE_KEY`, el componente muestra un aviso y el submit queda
   bloqueado (`disabled={loading || !captchaToken}`).

## 1. `index.html` — script oficial de Google

Agregar en `<head>` (con `render=explicit` para que lo controle React):

```html
<!-- reCAPTCHA v2 Checkbox (Google). Se renderiza de forma explícita desde RecaptchaCheckbox.tsx -->
<script src="https://www.google.com/recaptcha/api.js?render=explicit" async defer></script>
```

## 2. Nuevo: `src/components/ui/RecaptchaCheckbox.tsx` (+ export en `index.ts`)

Componente reutilizable con `forwardRef`. API:

```tsx
export interface RecaptchaCheckboxHandle { reset: () => void; }

<RecaptchaCheckbox ref={recaptchaRef} onToken={(t) => ...} />
```

- `onToken(token | null)`: recibe el token al marcar; recibe `null` al expirar
  (`expired-callback`) o fallar (`error-callback`). El padre guarda `captchaToken`
  y limpia el error.
- `reset()`: limpia el token local y resetea el widget. **Obligatorio llamarlo en
  cada error del backend**: el token v2 es de un solo uso y de ~2 min de vida.
- Render con reintentos (`setTimeout 200 ms × 50`) hasta que `window.grecaptcha`
  esté listo; guardia `renderedRef` anti-doble-render (React 19 StrictMode).
- Sin SITE_KEY muestra aviso en lugar del widget.

En `src/components/ui/index.ts` agregar:

```ts
export { default as RecaptchaCheckbox } from "./RecaptchaCheckbox";
export type { RecaptchaCheckboxHandle } from "./RecaptchaCheckbox";
```

## 3. `src/types/auth.ts` — campo nuevo en 3 DTOs

```ts
export interface LoginCredentials { email: string; password: string; recaptchaToken: string; }
export interface RegisterClientDTO { ...; termsAccepted: boolean; recaptchaToken: string; }
export interface RegisterProviderDTO { ...; termsAccepted: boolean; recaptchaToken: string; businessName: string; ... }
```

## 4. `src/api/auth.ts` — enviar el token

Agregar `recaptchaToken: credentials.recaptchaToken` / `data.recaptchaToken` al
`JSON.stringify` de `loginApi`, `registerClientApi` y `registerProviderApi`.
(`AuthContext.tsx` no cambia firmas: transporta el DTO tal cual.)

## 5. Formularios — patrón idéntico en los 3

Cada formulario (`InicioSesion.tsx`, `RegistroCliente.tsx`, `RegistroProveedor.tsx`
solo en **paso 2**) aplica:

```tsx
import { RecaptchaCheckbox } from '@/components/ui';
import type { RecaptchaCheckboxHandle } from '@/components/ui';

const [captchaToken, setCaptchaToken] = useState<string | null>(null);
const recaptchaRef = useRef<RecaptchaCheckboxHandle>(null);
const resetCaptcha = () => { setCaptchaToken(null); recaptchaRef.current?.reset(); };
```

- **Validación**: si `!captchaToken` → error `"Completa el captcha para continuar."`
  (en login: estado `captchaError`; en registros: `errors.recaptcha` / `errors2.recaptcha`).
- **Submit**: envía `recaptchaToken: captchaToken ?? ''` y en el `catch` llama
  `resetCaptcha()` antes de mostrar el error.
- **JSX** (justo antes del botón submit):
  ```tsx
  <div className="flex flex-col gap-1">
    <RecaptchaCheckbox ref={recaptchaRef} onToken={(t) => { setCaptchaToken(t); if (t) setCaptchaError(''); }} />
    {captchaError && <FieldError msg={captchaError} />}
  </div>
  ```
  (En registros se limpia con `setErrors(prev => ({...prev, recaptcha: ''}))`.)
- **Botón**: `disabled={loading || !captchaToken}`.
- **Ojo**: los botones ocultos de prueba en `InicioSesion.tsx` también deben pasar
  `recaptchaToken` (exigido por el tipo `LoginCredentials`).

## 6. Contrato con el backend

- `POST /api/v1/auth/login`, `POST /api/v1/registrations`,
  `POST /api/v1/registrations/provider` reciben `{ ..., "recaptchaToken": "<token>" }`.
- Sin token o token inválido el backend responde `400` (`"Completa el captcha..."` /
  `"Verificacion de captcha fallida..."`). El front ante cualquier `ApiError`
  resetea el widget para forzar un token fresco.

## 7. Verificación tras re-integrar

```bash
cd frontend
npx tsc --noEmit   # debe pasar sin errores
npm run build      # dist/ OK
```

Manual: sin marcar → error y submit bloqueado; marcado → pasa; tras fallo del
backend el checkbox se limpia; DevTools muestra `recaptchaToken` en el payload.

## 8. Archivos tocados (checklist `git status`)

- `frontend/index.html`, `frontend/.env.example`
- `frontend/src/components/ui/RecaptchaCheckbox.tsx` (nuevo)
- `frontend/src/components/ui/index.ts`
- `frontend/src/types/auth.ts`, `frontend/src/api/auth.ts`
- `frontend/src/features/auth/InicioSesion.tsx`
- `frontend/src/features/auth/RegistroCliente.tsx`
- `frontend/src/features/auth/RegistroProveedor.tsx`
