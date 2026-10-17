# Bloqueo por fuerza bruta — Cambios del Frontend (guía de re-integración)

> Historia de abuso: tras 5 contraseñas incorrectas el backend bloquea la cuenta
> 15 min y responde **429**. Este documento permite re-aplicar el (mínimo) cambio
> del front si se pierde en una integración. Ver también `recaptcha-frontend.md`.

Fecha: 2026-10-13 · Rama: `feature/reCaptcha`

## Único archivo tocado: `src/features/auth/InicioSesion.tsx`

El banner de error ya mostraba `err.message` (donde llega el texto del 429) y el
`catch` ya reseteaba el captcha, así que solo se agregó 1 estado y 3 líneas:

1. **Estado** (junto a `attempts`):
   ```tsx
   const [isBlocked, setIsBlocked] = useState(false);
   ```
2. **En el `catch` de `handleSubmit`**, tras `setGlobalError(err.message)`:
   ```tsx
   // 429 = bloqueo temporal por fuerza bruta: ofrecer recuperación de una vez.
   if (err.status === 429) setIsBlocked(true);
   else setIsBlocked(false);
   ```
   (`ApiError` en `src/api/client.ts` ya expone `status: number`, sin cambios ahí.)
3. **Condición del enlace “Recuperar contraseña”** en el banner:
   ```tsx
   {(attempts >= 3 || isBlocked) && ( ... )}
   ```
   Antes era solo `attempts >= 3`; con bloqueo, el enlace aparece desde el primer 429.
4. **Limpieza**: `setIsBlocked(false)` en los `onChange` de email y contraseña
   (espejando el `setGlobalError('')` existente), para ocultar el aviso al editar.

## Contrato con el backend (sin cambios en `api/auth.ts` ni tipos)

- `POST /api/v1/auth/login` → 401 credenciales malas (mensaje genérico, igual que antes).
- 5.º fallo → la cuenta se bloquea 15 min (ese intento aún responde 401) y el dueño
  recibe un correo; del 6.º en adelante → **429** con mensaje
  `"Demasiados intentos fallidos. Tu acceso fue bloqueado temporalmente..."`.
- El front ante cualquier error (incluido 429) resetea el widget reCAPTCHA
  (`resetCaptcha()` en el `catch`), así que el siguiente intento exige captcha fresco.

## Verificación tras re-integrar

```bash
npx tsc --noEmit && npm run build
```

Manual: 5 logins malos (misma cuenta) → al 6.º el banner muestra el mensaje de
bloqueo + enlace de recuperación inmediato; otra cuenta sigue entrando normal.
