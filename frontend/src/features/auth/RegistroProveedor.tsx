import React, { useState } from 'react';
import { NavBar } from '@/components/layout';
import {
  InputField,
  SelectField,
  TextareaField,
  PasswordStrength,
  FieldError,
  StepIndicator,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { RegisterProviderDTO } from '@/types/auth';

type Screen = 'paso1' | 'paso2' | 'verificacion' | 'confirmacion';

interface FormPaso1 {
  nombreNegocio: string;
  categoria: string;
  descripcion: string;
}

interface FormPaso2 {
  nombreContacto: string;
  email: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;
  terminos: boolean;
}

interface Errors {
  [key: string]: string;
}

const CATEGORIAS = [
  'Belleza y Estética',
  'Salud y Bienestar',
  'Entrenamiento Físico',
  'Reparaciones del Hogar',
  'Educación y Tutorías',
  'Fotografía y Video',
  'Limpieza y Mantenimiento',
  'Tecnología y TI',
  'Consultoría Profesional',
  'Otro',
];

const STEPS = [{ label: 'Datos del negocio' }, { label: 'Cuenta y contacto' }];

export default function RegistroProveedor() {
  const { navigate, registerProvider } = useAuth();
  const [screen, setScreen] = useState<Screen>('paso1');
  const [loading, setLoading] = useState(false);

  const [negocio, setNegocio] = useState<FormPaso1>({
    nombreNegocio: '',
    categoria: '',
    descripcion: '',
  });

  const [contacto, setContacto] = useState<FormPaso2>({
    nombreContacto: '',
    email: '',
    telefono: '',
    contrasena: '',
    confirmarContrasena: '',
    terminos: false,
  });

  const [errors1, setErrors1] = useState<Errors>({});
  const [errors2, setErrors2] = useState<Errors>({});
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // ─── Validación Paso 1 ─────────────────────────
  const validatePaso1 = (): boolean => {
    const e: Errors = {};
    if (!negocio.nombreNegocio.trim()) e.nombreNegocio = 'El nombre del negocio es obligatorio.';
    if (!negocio.categoria) e.categoria = 'Selecciona una categoría de servicio.';
    if (!negocio.descripcion.trim()) e.descripcion = 'La descripción es obligatoria.';
    else if (negocio.descripcion.trim().length < 20) {
      e.descripcion = 'La descripción debe tener al menos 20 caracteres.';
    }
    setErrors1(e);
    return Object.keys(e).length === 0;
  };

  // ─── Validación Paso 2 ─────────────────────────
  const validatePaso2 = (): boolean => {
    const e: Errors = {};
    if (!contacto.nombreContacto.trim()) e.nombreContacto = 'El nombre de contacto es obligatorio.';
    if (!contacto.email.trim()) e.email = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto.email)) {
      e.email = 'Ingresa un correo electrónico válido.';
    }
    if (!contacto.telefono.trim()) e.telefono = 'El teléfono de contacto es obligatorio.';
    if (!contacto.contrasena) e.contrasena = 'La contraseña es obligatoria.';
    else if (contacto.contrasena.length < 8 || !/[A-Z]/.test(contacto.contrasena) || !/[0-9]/.test(contacto.contrasena)) {
      e.contrasena = 'Mínimo 8 caracteres, una mayúscula y un número.';
    }
    if (!contacto.confirmarContrasena) e.confirmarContrasena = 'Confirma tu contraseña.';
    else if (contacto.contrasena !== contacto.confirmarContrasena) {
      e.confirmarContrasena = 'Las contraseñas no coinciden.';
    }
    if (!contacto.terminos) e.terminos = 'Debes aceptar los términos y condiciones comerciales.';
    setErrors2(e);
    return Object.keys(e).length === 0;
  };

  const handleNextPaso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePaso1()) setScreen('paso2');
  };

  const handleNextPaso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePaso2()) setScreen('verificacion');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.length < 4) {
      setVerificationError('Ingresa el código de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const providerData: RegisterProviderDTO = {
        businessName: negocio.nombreNegocio,
        category: negocio.categoria,
        description: negocio.descripcion,
        contactName: contacto.nombreContacto,
        email: contacto.email,
        phone: contacto.telefono,
        password: contacto.contrasena,
        termsAccepted: contacto.terminos,
      };

      await registerProvider(providerData);
      setScreen('confirmacion');
    } catch {
      setVerificationError('Código incorrecto o error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Confirmación ─────────────────────────────
  if (screen === 'confirmacion') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[500px] p-8 md:p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#005146] flex items-center justify-center mb-6 shadow-md text-white">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              PROMARKET — PROVEEDOR VERIFICADO
            </p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.56px] mb-2">
              ¡Negocio activado con éxito!
            </h1>
            <p className="text-[#66716c] text-[15px] leading-[22px] mb-6">
              El negocio <strong className="text-[#18211e]">{negocio.nombreNegocio}</strong> está listo para comenzar a ofrecer servicios y recibir reservas.
            </p>

            <div className="w-full bg-[#e6f0ef] border border-[#b8d4d1] rounded-[10px] p-4 mb-8 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#005146]" />
                <span className="text-[13px] font-semibold text-[#005146]">Próximo paso sugerido:</span>
              </div>
              <p className="text-[#18211e] text-[13px] leading-relaxed">
                Configura tu catálogo inicial en "Mis Servicios" para que los clientes puedan encontrarte y agendar turnos.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('servicios')}
                className="w-full bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer"
              >
                Ir al Panel de Servicios
              </button>
              <button
                type="button"
                onClick={() => navigate('perfil')}
                className="w-full border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] font-medium text-[14px] py-[12px] rounded-[8px] transition-colors bg-white cursor-pointer"
              >
                Ver perfil del negocio
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Verificación ─────────────────────────────
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
              Confirma tu correo comercial
            </h1>
            <p className="text-[#66716c] text-[14px] mb-4">
              Enviamos un código de verificación a: <br />
              <strong className="text-[#18211e]">{contacto.email}</strong>
            </p>

            <button
              type="button"
              onClick={() => {
                setVerificationCode('123456');
                setVerificationError('');
              }}
              className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6f0ef] hover:bg-[#d5e7e5] text-[#005146] text-[12px] font-medium rounded-full cursor-pointer transition-colors border border-[#b8d4d1]"
            >
              <span>Usar código de prueba:</span>
              <strong className="font-mono">123456</strong>
            </button>

            <form onSubmit={handleVerify} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[#18211e] text-[14px] font-medium">Código de 6 dígitos</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value);
                    setVerificationError('');
                  }}
                  className={`w-full border rounded-[8px] px-4 py-[12px] text-[18px] font-mono tracking-[0.3em] text-center bg-white outline-none transition-colors text-[#18211e]
                    ${verificationError ? 'border-[#d94f41]' : 'border-[#d4d9d3] focus:border-[#005146]'}`}
                />
                {verificationError && <FieldError msg={verificationError} />}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer"
              >
                {loading ? 'Activando...' : 'Completar registro de proveedor'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setScreen('paso2')}
              className="mt-6 text-[#66716c] hover:text-[#18211e] text-[13px] bg-transparent border-none cursor-pointer"
            >
              ← Volver al paso anterior
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Paso 2 ───────────────────────────────────
  if (screen === 'paso2') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[580px] p-8 md:p-10">
            <div className="mb-6">
              <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
                PROMARKET — REGISTRO DE PROVEEDOR
              </p>
              <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.6px]">
                Datos de cuenta y contacto
              </h1>
              <p className="text-[#66716c] text-[14px] leading-[20px] mt-1">
                Información para acceder al panel de administración y recibir notificaciones.
              </p>
            </div>

            <StepIndicator steps={STEPS} current={2} />

            <form onSubmit={handleNextPaso2} noValidate className="flex flex-col gap-4 mt-6">
              <InputField
                label="Nombre completo del responsable"
                placeholder="Carlos Mendoza"
                value={contacto.nombreContacto}
                onChange={(v) => {
                  setContacto({ ...contacto, nombreContacto: v });
                  setErrors2({ ...errors2, nombreContacto: '' });
                }}
                error={errors2.nombreContacto}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Correo electrónico de acceso"
                  type="email"
                  placeholder="contacto@centrovital.com"
                  value={contacto.email}
                  onChange={(v) => {
                    setContacto({ ...contacto, email: v });
                    setErrors2({ ...errors2, email: '' });
                  }}
                  error={errors2.email}
                />
                <InputField
                  label="Teléfono de atención"
                  type="tel"
                  placeholder="+52 55 9876 5432"
                  value={contacto.telefono}
                  onChange={(v) => {
                    setContacto({ ...contacto, telefono: v });
                    setErrors2({ ...errors2, telefono: '' });
                  }}
                  error={errors2.telefono}
                />
              </div>

              <div className="flex flex-col gap-1">
                <InputField
                  label="Contraseña"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={contacto.contrasena}
                  onChange={(v) => {
                    setContacto({ ...contacto, contrasena: v });
                    setErrors2({ ...errors2, contrasena: '' });
                  }}
                  error={errors2.contrasena}
                />
                <PasswordStrength password={contacto.contrasena} />
              </div>

              <InputField
                label="Confirmar contraseña"
                type="password"
                placeholder="Repite tu contraseña"
                value={contacto.confirmarContrasena}
                onChange={(v) => {
                  setContacto({ ...contacto, confirmarContrasena: v });
                  setErrors2({ ...errors2, confirmarContrasena: '' });
                }}
                error={errors2.confirmarContrasena}
              />

              <div className="flex flex-col gap-1 mt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contacto.terminos}
                    onChange={(e) => {
                      setContacto({ ...contacto, terminos: e.target.checked });
                      setErrors2({ ...errors2, terminos: '' });
                    }}
                    className="mt-[3px] w-4 h-4 accent-[#005146] cursor-pointer shrink-0"
                  />
                  <span className="text-[13px] leading-[18px] text-[#18211e]">
                    Acepto los Términos de Servicio para Proveedores y la Política de Privacidad de ProMarket.
                  </span>
                </label>
                {errors2.terminos && <div className="ml-7"><FieldError msg={errors2.terminos} /></div>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen('paso1')}
                  className="px-5 py-[12px] border border-[#d4d9d3] text-[#18211e] hover:bg-gray-100 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer bg-white"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors cursor-pointer"
                >
                  Finalizar registro
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ─── Paso 1 ───────────────────────────────────
  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="bg-[#fcfcf8] rounded-[16px] border border-[#d4d9d3] shadow-sm w-full max-w-[580px] p-8 md:p-10">
          {/* Card para clientes arriba del todo para evitar confusiones */}
          <div className="mb-6 p-4 rounded-[12px] bg-[#e6f0ef] border border-[#b8d4d1] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#005146] text-white flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[13.5px] font-bold text-[#005146]">¿Buscas contratar servicios?</p>
                <p className="text-[12px] text-[#4d5753] leading-snug">Crea tu cuenta de cliente para explorar el catálogo y agendar citas.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('registro-cliente')}
              className="shrink-0 px-3.5 py-1.5 bg-[#005146] hover:bg-[#00403b] text-white text-[12.5px] font-semibold rounded-[6px] transition-colors cursor-pointer shadow-xs"
            >
              Soy cliente →
            </button>
          </div>

          <div className="mb-6">
            <p className="text-[#005146] text-[12px] font-semibold tracking-[0.96px] uppercase mb-2">
              PROMARKET — REGISTRO DE PROVEEDOR
            </p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.6px]">
              Registra tu negocio o servicio
            </h1>
            <p className="text-[#66716c] text-[14px] leading-[20px] mt-1">
              Únete a la red de proveedores profesionales y gestiona tus reservas fácilmente.
            </p>
          </div>

          <StepIndicator steps={STEPS} current={1} />

          <form onSubmit={handleNextPaso1} noValidate className="flex flex-col gap-4 mt-6">
            <InputField
              label="Nombre comercial del negocio"
              placeholder="Ej: Centro Vital Salud y Bienestar"
              value={negocio.nombreNegocio}
              onChange={(v) => {
                setNegocio({ ...negocio, nombreNegocio: v });
                setErrors1({ ...errors1, nombreNegocio: '' });
              }}
              error={errors1.nombreNegocio}
            />

            <SelectField
              label="Categoría principal"
              value={negocio.categoria}
              onChange={(v) => {
                setNegocio({ ...negocio, categoria: v });
                setErrors1({ ...errors1, categoria: '' });
              }}
              options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
              placeholder="Selecciona una categoría..."
              error={errors1.categoria}
            />

            <TextareaField
              label="Descripción del negocio y servicios"
              value={negocio.descripcion}
              onChange={(v) => {
                setNegocio({ ...negocio, descripcion: v });
                setErrors1({ ...errors1, descripcion: '' });
              }}
              placeholder="Describe tu experiencia, los servicios que ofreces y tu enfoque..."
              error={errors1.descripcion}
              hint="Mínimo 20 caracteres."
              maxLength={300}
            />

            <div className="flex gap-3 bg-[#e6f0ef] border border-[#b8d4d1] rounded-[8px] px-4 py-3">
              <svg className="shrink-0 mt-0.5 text-[#005146]" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-[#18211e] text-[13px] leading-tight">
                Esta información será visible en tu perfil público ante los clientes.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] py-[12px] rounded-[8px] transition-colors mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              Continuar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
