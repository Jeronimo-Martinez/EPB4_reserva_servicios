import React, { useState } from 'react';
import { NavBar } from '@/components/layout';
import { InputField, FieldError } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';

type Screen = 'login' | 'recuperacion' | 'recuperacion-enviada';

export default function InicioSesion({ onRegistro }: { onRegistro?: () => void }) {
  const { login, navigate } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleRegisterClick = () => {
    if (onRegistro) {
      onRegistro();
    } else {
      navigate('registro-cliente');
    }
  };

  const validate = (): boolean => {
    let ok = true;
    setEmailError('');
    setPasswordError('');
    setGlobalError('');

    if (!email.trim()) {
      setEmailError('Ingresa tu correo electrónico.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('El formato del correo no es válido.');
      ok = false;
    }

    if (!password) {
      setPasswordError('Ingresa tu contraseña.');
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError('');

    try {
      await login({ email: email.trim(), password });
      // Redirección manejada en AuthContext según rol
    } catch (err: unknown) {
      const next = attempts + 1;
      setAttempts(next);
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError(
          next >= 3
            ? 'Demasiados intentos fallidos. Verifica tus credenciales o recupera tu contraseña.'
            : 'Correo electrónico o contraseña incorrectos. Verifica tus datos e intenta de nuevo.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setEmailError('');
    setPasswordError('');
    setGlobalError('');
  };

  // ─── Recuperación enviada ──────────────────────
  if (screen === 'recuperacion-enviada') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[460px] p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#e6f0ef] flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="#005146" strokeWidth="1.8" />
                <path d="M2 8l10 7 10-7" stroke="#005146" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              PROMARKET — RECUPERAR CONTRASEÑA
            </p>
            <h1 className="text-[#18211e] text-[26px] font-bold leading-[34px] tracking-[-0.52px] mb-3">
              Revisa tu correo
            </h1>
            <p className="text-[#66716c] text-[14px] mb-1">Enviamos instrucciones a:</p>
            <p className="text-[#18211e] text-[14px] font-semibold mb-6">{recoveryEmail}</p>
            <div className="w-full flex gap-3 bg-[#e6f0ef] border border-[#b8d4d1] rounded-[8px] px-4 py-3 mb-7 text-left">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#005146" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="#005146" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-[#18211e] text-[13px] leading-[20px]">
                El enlace es válido por <strong>30 minutos</strong>. Revisa también tu carpeta de spam.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScreen('login')}
              className="w-full bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Recuperación ─────────────────────────────
  if (screen === 'recuperacion') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[460px] p-8 md:p-10">
            <button
              type="button"
              onClick={() => setScreen('login')}
              className="flex items-center gap-1.5 text-[#66716c] text-[13px] font-medium hover:text-[#18211e] transition-colors mb-6 bg-transparent border-none cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Volver al inicio de sesión
            </button>
            <div className="w-14 h-14 rounded-full bg-[#e6f0ef] flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#005146" strokeWidth="1.8" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#005146" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#005146" />
              </svg>
            </div>
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              PROMARKET — RECUPERAR CONTRASEÑA
            </p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.56px] mb-2">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-[#66716c] text-[14px] leading-[20px] mb-7">
              Ingresa tu correo y te enviaremos las instrucciones para restablecerla.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setEmailError('Ingresa un correo electrónico válido.');
                  return;
                }
                setRecoveryEmail(email);
                setScreen('recuperacion-enviada');
              }}
              noValidate
              className="flex flex-col gap-4"
            >
              <InputField
                label="Correo electrónico"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setEmailError('');
                }}
                error={emailError}
              />
              <button
                type="submit"
                className="w-full bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer"
              >
                Enviar instrucciones
              </button>
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="w-full border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] font-medium text-[14px] py-[12px] rounded-[8px] transition-colors bg-white cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ─── Login Screen ────────────────────────────
  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[480px] p-8 md:p-10">
          <div className="mb-6">
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              Inicio de Sesión
            </p>
            <h1 className="text-[#18211e] text-[30px] font-bold leading-[38px] tracking-[-0.6px]">
              Bienvenido de nuevo
            </h1>
            <p className="text-[#66716c] text-[14px] leading-[20px] mt-2">
              Accede a tu cuenta para gestionar tus reservas y servicios.
            </p>
          </div>

          {/* Accesos rápidos de prueba */}
          <div className="bg-[#e6f0ef] border border-[#b8d4d1] rounded-[10px] p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#005146] text-[12px] font-semibold uppercase tracking-wider">
                Acceso Rápido de Prueba
              </span>
              <span className="text-[#005146] text-[11px] bg-white px-2 py-0.5 rounded-full font-medium">
                Simulación
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await login({ email: 'cliente.demo@example.com', password: 'Cliente123' });
                }}
                className="flex-1 bg-white hover:bg-[#d5e7e5] border border-[#b8d4d1] rounded-[8px] py-2 px-3 text-left transition-colors cursor-pointer"
              >
                <strong className="text-[#005146] text-[13px] block">Entrar como Cliente</strong>
                <span className="text-[11px] text-[#66716c]">Ana Gómez</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  await login({ email: 'contacto@centrovital.com', password: 'Proveedor1!' });
                }}
                className="flex-1 bg-white hover:bg-[#d5e7e5] border border-[#b8d4d1] rounded-[8px] py-2 px-3 text-left transition-colors cursor-pointer"
              >
                <strong className="text-[#005146] text-[13px] block">Entrar como Proveedor</strong>
                <span className="text-[11px] text-[#66716c]">Centro Vital</span>
              </button>
            </div>
          </div>


          {/* Banner de error */}
          {globalError && (
            <div className="flex gap-3 bg-[#fdf1f0] border border-[#f2bfbb] rounded-[8px] px-4 py-3 mb-5">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#d94f41" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="#d94f41" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <div className="flex-1">
                <p className="text-[#d94f41] text-[13px] leading-[20px]">{globalError}</p>
                {attempts >= 3 && (
                  <button
                    type="button"
                    onClick={() => setScreen('recuperacion')}
                    className="text-[#d94f41] text-[13px] font-semibold underline mt-1 hover:opacity-75 bg-transparent border-none cursor-pointer"
                  >
                    Recuperar contraseña
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <InputField
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setEmailError('');
                setGlobalError('');
              }}
              error={emailError}
            />

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[#18211e] text-[14px] font-medium">Contraseña</label>
                <button
                  type="button"
                  onClick={() => setScreen('recuperacion')}
                  className="text-[#005146] text-[13px] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setGlobalError('');
                  }}
                  className={`w-full border rounded-[8px] px-4 py-[10px] pr-11 text-[14px] bg-white outline-none transition-colors text-[#18211e]
                    ${passwordError || globalError ? 'border-[#d94f41]' : 'border-[#d4d9d3] focus:border-[#005146]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66716c] hover:text-[#18211e] transition-colors cursor-pointer bg-transparent border-none"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <FieldError msg={passwordError} />}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors mt-1 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
                  </svg>
                  Verificando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#d4d9d3]" />
            <span className="text-[#66716c] text-[12px]">o regístrate</span>
            <div className="flex-1 h-px bg-[#d4d9d3]" />
          </div>

          <div className="flex flex-col gap-2 text-center text-[13px]">
            <p className="text-[#66716c]">
              ¿Buscas contratar servicios?{' '}
              <button
                type="button"
                onClick={() => navigate('registro-cliente')}
                className="text-[#005146] font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                Crear cuenta como cliente
              </button>
            </p>
            <p className="text-[#66716c]">
              ¿Ofreces servicios profesionales?{' '}
              <button
                type="button"
                onClick={() => navigate('registro-proveedor')}
                className="text-[#005146] font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                Registrar mi negocio
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
