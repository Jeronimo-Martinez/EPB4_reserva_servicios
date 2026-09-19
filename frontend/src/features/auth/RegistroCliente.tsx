import React, { useState } from 'react';
import { NavBar } from '@/components/layout';
import { InputField, PasswordStrength, FieldError } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { registerClientApi, verifyClientCodeApi } from '@/api/auth';
import { ApiError } from '@/api/client';

type Screen = 'registro' | 'verificacion' | 'confirmacion';

interface FormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;
  terminos: boolean;
}

interface Errors {
  [key: string]: string;
}

export default function RegistroCliente() {
  const { navigate, registerClient } = useAuth();
  const [screen, setScreen] = useState<Screen>('registro');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Form state
  const [form, setForm] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    confirmarContrasena: '',
    terminos: false,
  });
  const [errors, setErrors] = useState<Errors>({});

  // Verification state
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [resentMessage, setResentMessage] = useState('');

  const set = (field: keyof FormData) => (value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setGlobalError('');
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio.';
    if (!form.email.trim()) e.email = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Ingresa un correo electrónico válido.';
    }

    if (!form.telefono.trim()) {
      e.telefono = 'El teléfono es obligatorio.';
    }

    if (!form.contrasena) {
      e.contrasena = 'La contraseña es obligatoria.';
    } else if (
      form.contrasena.length < 8 ||
      !/[A-Z]/.test(form.contrasena) ||
      !/[0-9]/.test(form.contrasena)
    ) {
      e.contrasena =
        'Mínimo 8 caracteres, al menos una mayúscula y al menos un número.';
    }

    if (!form.confirmarContrasena) {
      e.confirmarContrasena = 'Confirma tu contraseña.';
    } else if (form.contrasena !== form.confirmarContrasena) {
      e.confirmarContrasena = 'Las contraseñas no coinciden.';
    }

    if (!form.terminos) {
      e.terminos = 'Debes aceptar los términos y condiciones.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError('');

    try {
      await registerClientApi({
        firstName: form.nombre.trim(),
        lastName: form.apellido.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.telefono.trim(),
        password: form.contrasena,
        termsAccepted: form.terminos,
      });

      setScreen('verificacion');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError('Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 4) {
      setCodeError('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    setLoading(true);
    setCodeError('');

    try {
      await verifyClientCodeApi({
        email: form.email.trim().toLowerCase(),
        code: code.trim(),
      });

      // Crear usuario activo en AuthContext
      await registerClient({
        firstName: form.nombre.trim(),
        lastName: form.apellido.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.telefono.trim(),
        password: form.contrasena,
        termsAccepted: form.terminos,
      });

      setScreen('confirmacion');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCodeError(err.message);
      } else {
        setCodeError('Código incorrecto o expirado.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Pantalla 3: Confirmación ─────────────────
  if (screen === 'confirmacion') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[480px] p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#005146] flex items-center justify-center mb-6 shadow-md text-white">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              ¡Registro Exitoso!
            </p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.56px] mb-3">
              ¡Bienvenido a ProMarket, {form.nombre}!
            </h1>
            <p className="text-[#66716c] text-[15px] leading-[24px] mb-6">
              Tu cuenta ha sido creada y verificada exitosamente. Ya puedes explorar el catálogo y agendar citas.
            </p>

            <div className="w-full bg-[#e6f0ef] border border-[#b8d4d1] rounded-[10px] px-5 py-3.5 mb-8 text-left flex gap-3 items-center">
              <svg className="shrink-0 text-[#005146]" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-[#18211e] text-[13px] leading-tight">
                Hemos enviado la confirmación y detalles a <strong>{form.email}</strong>.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('catalogo')}
                className="w-full bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer"
              >
                Explorar catálogo de servicios
              </button>
              <button
                type="button"
                onClick={() => navigate('perfil')}
                className="w-full border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] font-medium text-[14px] py-[12px] rounded-[8px] transition-colors bg-white cursor-pointer"
              >
                Ver mi perfil
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Pantalla 2: Verificación de Código ───────
  if (screen === 'verificacion') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[480px] p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#e6f0ef] flex items-center justify-center mb-6 text-[#005146]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              Verificación de Cuenta
            </p>
            <h1 className="text-[#18211e] text-[26px] font-bold leading-[34px] tracking-[-0.52px] mb-2">
              Verifica tu correo electrónico
            </h1>
            <p className="text-[#66716c] text-[14px] mb-4">
              Enviamos un código de verificación de 6 dígitos a: <br />
              <strong className="text-[#18211e]">{form.email}</strong>
            </p>

            <button
              type="button"
              onClick={() => {
                setCode('123456');
                setCodeError('');
              }}
              className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6f0ef] hover:bg-[#d5e7e5] text-[#005146] text-[12px] font-medium rounded-full cursor-pointer transition-colors border border-[#b8d4d1]"
            >
              <span>Usar código de prueba:</span>
              <strong className="font-mono">123456</strong>
            </button>

            <form onSubmit={handleVerifySubmit} noValidate className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[#18211e] text-[14px] font-medium">
                  Código de 6 dígitos (ej. 123456)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError('');
                  }}
                  className={`w-full border rounded-[8px] px-4 py-[12px] text-[18px] font-mono tracking-[0.3em] text-center bg-white outline-none transition-colors text-[#18211e]
                    ${codeError ? 'border-[#d94f41]' : 'border-[#d4d9d3] focus:border-[#005146]'}`}
                />
                {codeError && <FieldError msg={codeError} />}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Verificando...' : 'Confirmar y Activar Cuenta'}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-1">
              <p className="text-[#66716c] text-[13px]">¿No recibiste el correo?</p>
              <button
                type="button"
                onClick={() => setResentMessage('Código reenviado exitosamente a tu correo.')}
                className="text-[#005146] text-[13px] font-semibold underline hover:opacity-80 bg-transparent border-none cursor-pointer"
              >
                Reenviar código
              </button>
              {resentMessage && (
                <p className="text-[#005146] text-[12px] bg-[#e6f0ef] px-3 py-1 rounded-full mt-2">
                  {resentMessage}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setScreen('registro')}
              className="mt-6 text-[#66716c] hover:text-[#18211e] text-[13px] bg-transparent border-none cursor-pointer"
            >
              ← Modificar correo o datos
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Pantalla 1: Formulario Registro ──────────
  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[560px] p-8 md:p-10">
          {/* Card para proveedores arriba del todo para evitar confusiones */}
          <div className="mb-6 p-4 rounded-[12px] bg-[#e6f0ef] border border-[#b8d4d1] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#005146] text-white flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-[#005146]">¿Eres proveedor o tienes un negocio?</p>
                <p className="text-[12px] text-[#4d5753] leading-snug">Regístrate como profesional para publicar servicios y gestionar citas.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('registro-proveedor')}
              className="shrink-0 px-3.5 py-1.5 bg-[#005146] hover:bg-[#00403b] text-white text-[12.5px] font-semibold rounded-[6px] transition-colors cursor-pointer shadow-xs"
            >
              Soy proveedor →
            </button>
          </div>

          <div className="mb-8">
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              Registro de Cliente
            </p>
            <h1 className="text-[#18211e] text-[30px] font-bold leading-[38px] tracking-[-0.6px]">
              Crea tu cuenta de cliente
            </h1>
            <p className="text-[#66716c] text-[14px] leading-[20px] mt-2">
              Únete a ProMarket y comienza a reservar servicios profesionales en minutos.
            </p>
          </div>

          {globalError && (
            <div className="flex gap-3 bg-[#fdf1f0] border border-[#f2bfbb] rounded-[8px] px-4 py-3 mb-5">
              <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#d94f41" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="#d94f41" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-[#d94f41] text-[13px] leading-[20px]">{globalError}</p>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nombre"
                placeholder="Ana"
                value={form.nombre}
                onChange={set('nombre') as (v: string) => void}
                error={errors.nombre}
              />
              <InputField
                label="Apellido"
                placeholder="Gómez"
                value={form.apellido}
                onChange={set('apellido') as (v: string) => void}
                error={errors.apellido}
              />
            </div>

            <InputField
              label="Correo electrónico"
              type="email"
              placeholder="ana.gomez@example.com"
              value={form.email}
              onChange={set('email') as (v: string) => void}
              error={errors.email}
            />

            <InputField
              label="Teléfono"
              type="tel"
              placeholder="+573001234567"
              value={form.telefono}
              onChange={set('telefono') as (v: string) => void}
              error={errors.telefono}
            />

            <div className="flex flex-col gap-1">
              <InputField
                label="Contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                value={form.contrasena}
                onChange={set('contrasena') as (v: string) => void}
                error={errors.contrasena}
              />
              <PasswordStrength password={form.contrasena} />
            </div>

            <InputField
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              value={form.confirmarContrasena}
              onChange={set('confirmarContrasena') as (v: string) => void}
              error={errors.confirmarContrasena}
            />

            <div className="flex flex-col gap-1 mt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terminos}
                  onChange={(e) => set('terminos')(e.target.checked)}
                  className="mt-[3px] w-4 h-4 accent-[#005146] cursor-pointer shrink-0"
                />
                <span className="text-[13px] leading-[18px] text-[#18211e]">
                  He leído y acepto los{' '}
                  <span className="text-[#005146] font-semibold underline">
                    Términos y Condiciones
                  </span>{' '}
                  y la{' '}
                  <span className="text-[#005146] font-semibold underline">
                    Política de Privacidad
                  </span>
                  .
                </span>
              </label>
              {errors.terminos && (
                <div className="ml-7">
                  <FieldError msg={errors.terminos} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-[#ecefe9]">
            <p className="text-[#66716c] text-[13px]">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('login')}
                className="text-[#005146] font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
