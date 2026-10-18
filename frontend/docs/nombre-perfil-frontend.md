# Nombre/apellido reales en sesión y perfil — Cambios del Frontend (guía de re-integración)

> Bug: el perfil mostraba el prefijo del email como nombre ("jmartinez.carabali") y
> "Demo" como apellido fijo. Causa: `AuthContext` inventaba `firstName` con
> `email.split('@')[0]` y el backend no enviaba nombre en `LoginResponse`/
> `VerificationResponse`. Afectaba igual a CLIENTE y PROVEEDOR (mismo flujo).
> Este documento permite re-aplicar el fix del front si se pierde en una integración.

Fecha: 2026-10-16 · Rama: `feature/reCaptcha`

## Contrato nuevo del backend

`LoginResponse` y `VerificationResponse` ahora incluyen:
`firstName` (string, siempre), `lastName?`, `businessName?`, `businessCategory?`
(los 2 últimos solo para rol PROVEEDOR; vacíos para clientes).

## Archivos tocados (checklist `git status`)

- `frontend/src/types/auth.ts`
- `frontend/src/context/AuthContext.tsx`

No se tocaron `PerfilUsuario.tsx`, `NavBar.tsx` ni `api/auth.ts` — consumen
`user.firstName`/`user.lastName`/`user.businessName` del contexto y ya funcionan
cuando el dato llega correcto.

## 1. `src/types/auth.ts` — nuevos campos en 2 responses

```ts
export interface LoginResponse {
  message: string; email: string; role: UserRole; redirectTo: string; token: string;
  firstName: string;          // ← nuevo
  lastName?: string;          // ← nuevo
  businessName?: string;      // ← nuevo (solo PROVEEDOR)
  businessCategory?: string;  // ← nuevo (solo PROVEEDOR)
}

export interface VerifyCodeResponse {
  message: string; email: string; role: UserRole; token: string;
  firstName: string;          // ← nuevo
  lastName?: string;          // ← nuevo
  businessName?: string;      // ← nuevo
  businessCategory?: string;  // ← nuevo
}
```

(`User` ya tenía `businessName?`/`businessCategory?` declarados; nunca se asignaban.)

## 2. `src/context/AuthContext.tsx` — usar el nombre real

**En `login()`** (antes de `signIn(loggedUser)`):
```ts
const loggedUser: User = {
  id: `user-${res.email}`,
  email: res.email,
  firstName: res.firstName || res.email.split('@')[0],  // fallback si backend viejo
  lastName: res.lastName,                                // ← antes no se asignaba
  role: res.role,
  businessName: res.businessName,                        // ← antes siempre undefined
  businessCategory: res.businessCategory,                // ← antes siempre undefined
  isVerified: true,
  token: res.token,
};
```

**En `verifyCode()`** — mismo patrón:
```ts
const newUser: User = {
  id: `user-${res.email}`,
  email: res.email,
  firstName: res.firstName || email.split('@')[0],
  lastName: res.lastName,
  role: res.role as User['role'],
  businessName: res.businessName,
  businessCategory: res.businessCategory,
  isVerified: true,
  token: res.token,
};
```

## Límite conocido

Sesiones viejas en `localStorage` (`promarket_auth_user`) conservan el nombre
inventado hasta que el usuario cierre sesión y vuelva a entrar. No hay endpoint
`/me` que refresque el dato automáticamente.

## Verificación tras re-integrar

```bash
npx tsc --noEmit && npm run build
```

Manual: registrar cliente/proveedor, verificar código, ir al perfil → nombre y
apellido reales; si es proveedor, el aside muestra `businessName`/`businessCategory`
reales en lugar de "Mi Negocio"/"Salud y Bienestar".
