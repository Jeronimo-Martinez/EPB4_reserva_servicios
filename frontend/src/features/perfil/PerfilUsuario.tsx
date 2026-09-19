import React, { useState } from 'react';
import { NavBar, SideNav } from '@/components/layout';
import { InputField, Toggle, SuccessBanner, FieldError } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

type Mode = 'ver' | 'editar';

interface ProfileData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  ciudad: string;
  pais: string;
  notifEmail: boolean;
  notifSMS: boolean;
}

interface Errors {
  [key: string]: string;
}

function ReadonlyField({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[#66716c] text-[12px] font-medium uppercase tracking-[0.72px]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[#18211e] text-[15px] leading-[22px] font-medium">
          {value || 'No especificado'}
        </span>
        {badge && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6f0ef] text-[#005146] text-[11px] font-semibold border border-[#b8d4d1]">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#005146" strokeWidth="1.5" />
              <path d="M3.5 6l2 2 3-3" stroke="#005146" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 flex flex-col gap-5 shadow-xs">
      <p className="text-[#18211e] text-[15px] font-semibold pb-3 border-b border-[#d4d9d3]">
        {title}
      </p>
      {children}
    </div>
  );
}

export default function PerfilUsuario() {
  const { user, updateUserProfile, navigate, logout } = useAuth();
  const [mode, setMode] = useState<Mode>('ver');
  const [showSuccess, setShowSuccess] = useState(false);

  const [data, setData] = useState<ProfileData>({
    nombre: user?.firstName || 'Usuario',
    apellido: user?.lastName || 'Demo',
    email: user?.email || 'usuario@ejemplo.com',
    telefono: user?.phone || '+57 300 123 4567',
    ciudad: 'Bogotá / Ciudad',
    pais: 'Colombia',
    notifEmail: true,
    notifSMS: false,
  });

  const [form, setForm] = useState<ProfileData>(data);
  const [errors, setErrors] = useState<Errors>({});

  const isProvider = user?.role === 'PROVEEDOR';

  const sideNavItems = isProvider
    ? [
        {
          label: 'Mis Servicios',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ),
          onClick: () => navigate('servicios'),
        },
        {
          label: 'Perfil de Negocio',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ),
          onClick: () => setMode('ver'),
        },
        {
          label: 'Cerrar Sesión',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          onClick: () => logout(),
        },
      ]
    : [
        {
          label: 'Mi Perfil',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ),
          onClick: () => setMode('ver'),
        },
        {
          label: 'Cerrar Sesión',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          onClick: () => logout(),
        },
      ];

  const setField = (field: keyof ProfileData) => (val: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim()) e.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'El formato del correo no es válido.';
    }
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setData(form);
    updateUserProfile({
      firstName: form.nombre,
      lastName: form.apellido,
      email: form.email,
      phone: form.telefono,
    });
    setMode('ver');
    setShowSuccess(true);
  };

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[240px] shrink-0">
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 mb-5 shadow-xs">
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
              {isProvider ? 'Panel Profesional' : 'Perfil de Cliente'}
            </p>
            <p className="text-[#18211e] text-[17px] font-bold leading-snug truncate">
              {isProvider
                ? user?.businessName || `${data.nombre} ${data.apellido}`
                : `${data.nombre} ${data.apellido}`}
            </p>
            <span className="inline-block mt-1 text-[12px] text-[#005146] bg-[#e6f0ef] px-2.5 py-0.5 rounded-full font-medium">
              {isProvider
                ? user?.businessCategory || 'Salud y Bienestar'
                : 'Cliente Verificado'}
            </span>
          </div>

          <SideNav
            items={sideNavItems}
            active={isProvider ? 'Perfil de Negocio' : 'Mi Perfil'}
          />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {showSuccess && mode === 'ver' && (
            <SuccessBanner
              title="Perfil actualizado con éxito"
              description="Tus datos personales han sido guardados correctamente."
              onDismiss={() => setShowSuccess(false)}
            />
          )}

          {mode === 'ver' ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[#18211e] text-[24px] font-bold">
                    {isProvider ? 'Perfil de Negocio y Contacto' : 'Datos personales y de contacto'}
                  </h2>
                  <p className="text-[#66716c] text-[14px] mt-0.5">
                    {isProvider
                      ? 'Información comercial y credenciales asociadas a tu cuenta profesional.'
                      : 'Información asociada a tu cuenta de ProMarket.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForm(data);
                    setMode('editar');
                    setShowSuccess(false);
                  }}
                  className="flex items-center justify-center gap-2 border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] font-semibold text-[14px] px-4 py-[9px] rounded-[8px] transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Editar información
                </button>
              </div>

              {/* Avatar card */}
              <div className="flex items-center gap-5 bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] px-6 py-5 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#005146] text-white flex items-center justify-center shrink-0 text-[24px] font-bold">
                  {data.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[#18211e] text-[20px] font-bold">
                    {data.nombre} {data.apellido}
                  </p>
                  <p className="text-[#66716c] text-[14px]">{data.email}</p>
                  {user?.businessName && (
                    <p className="text-[#005146] text-[13px] font-semibold mt-0.5">
                      {user.businessName} ({user.businessCategory})
                    </p>
                  )}
                </div>
              </div>

              <SectionCard title="Información Personal">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="Nombre" value={data.nombre} />
                  <ReadonlyField label="Apellido" value={data.apellido} />
                  <ReadonlyField label="Correo electrónico" value={data.email} badge="Verificado" />
                  <ReadonlyField label="Teléfono" value={data.telefono} badge="Verificado" />
                  <ReadonlyField label="Ciudad" value={data.ciudad} />
                  <ReadonlyField label="País" value={data.pais} />
                </div>
              </SectionCard>

              <SectionCard title="Preferencias de Comunicación">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <p className="text-[14px] font-medium text-[#18211e]">Notificaciones por correo</p>
                      <p className="text-[12px] text-[#66716c]">Confirmaciones de reservas y recordatorios de citas.</p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#005146]">
                      {data.notifEmail ? 'Activadas' : 'Desactivadas'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="text-[14px] font-medium text-[#18211e]">Alertas por SMS / WhatsApp</p>
                      <p className="text-[12px] text-[#66716c]">Avisos urgentes sobre cambios de horarios.</p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#66716c]">
                      {data.notifSMS ? 'Activadas' : 'Desactivadas'}
                    </span>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#18211e] text-[24px] font-bold">Editar Perfil</h2>
                  <p className="text-[#66716c] text-[14px] mt-0.5">
                    Modifica tus datos de contacto y preferencias.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode('ver')}
                  className="text-[#66716c] hover:text-[#18211e] text-[14px] font-medium bg-transparent border-none cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <SectionCard title="Datos de contacto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Nombre"
                    value={form.nombre}
                    onChange={setField('nombre') as (v: string) => void}
                    error={errors.nombre}
                  />
                  <InputField
                    label="Apellido"
                    value={form.apellido}
                    onChange={setField('apellido') as (v: string) => void}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Correo electrónico"
                    type="email"
                    value={form.email}
                    onChange={setField('email') as (v: string) => void}
                    error={errors.email}
                  />
                  <InputField
                    label="Teléfono"
                    value={form.telefono}
                    onChange={setField('telefono') as (v: string) => void}
                    error={errors.telefono}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Ciudad"
                    value={form.ciudad}
                    onChange={setField('ciudad') as (v: string) => void}
                  />
                  <InputField
                    label="País"
                    value={form.pais}
                    onChange={setField('pais') as (v: string) => void}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Preferencias de Notificación">
                <div className="flex flex-col gap-4">
                  <Toggle
                    label="Recibir confirmaciones y avisos por correo"
                    checked={form.notifEmail}
                    onChange={(checked) => setField('notifEmail')(checked)}
                  />
                  <Toggle
                    label="Recibir alertas por SMS al teléfono registrado"
                    checked={form.notifSMS}
                    onChange={(checked) => setField('notifSMS')(checked)}
                  />
                </div>
              </SectionCard>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setMode('ver')}
                  className="px-5 py-2.5 border border-[#d4d9d3] text-[#18211e] hover:bg-gray-100 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
