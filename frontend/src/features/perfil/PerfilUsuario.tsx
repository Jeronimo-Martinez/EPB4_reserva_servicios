import React, { useEffect, useState } from 'react';
import { NavBar, SideNav, useProviderNavItems } from '@/components/layout';
import { InputField, SuccessBanner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { ProfileData, fetchProfile, updateProfile } from '@/api/auth';

type Mode = 'ver' | 'editar';

interface Form {
  firstName: string;
  lastName: string;
  phone: string;
}

// Same rule as the backend (and the registration).
const PHONE = /^\+?[0-9()\- ]{7,20}$/;

function ReadonlyField({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[#66716c] text-[12px] font-medium uppercase tracking-[0.72px]">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[#18211e] text-[15px] leading-[22px] font-medium break-all">{value || 'No especificado'}</span>
        {badge && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e6f0ef] text-[#005146] text-[11px] font-semibold border border-[#b8d4d1]">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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
      <p className="text-[#18211e] text-[15px] font-semibold pb-3 border-b border-[#d4d9d3]">{title}</p>
      {children}
    </div>
  );
}

const personIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/** HU-05: shows the profile from the backend; only name, last name and phone can change. */
export default function PerfilUsuario() {
  const { user, updateUserProfile, navigate, logout } = useAuth();
  const [mode, setMode] = useState<Mode>('ver');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<Form>({ firstName: '', lastName: '', phone: '' });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err: unknown) => setLoadError(err instanceof ApiError ? err.message : 'No pudimos cargar tu perfil.'));
  }, []);

  const isProvider = user?.role === 'PROVEEDOR';
  const providerNavItems = useProviderNavItems({ 'Perfil de Negocio': () => setMode('ver') });
  const sideNavItems = isProvider
    ? providerNavItems
    : [
        { label: 'Mi Perfil', icon: personIcon, onClick: () => setMode('ver') },
        {
          label: 'Mis Reservas',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ),
          onClick: () => navigate('reservas'),
        },
        {
          label: 'Cerrar Sesión',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          onClick: () => logout(),
        },
      ];

  const fullName = profile ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : '';

  const startEditing = () => {
    if (!profile) return;
    setForm({ firstName: profile.firstName, lastName: profile.lastName ?? '', phone: profile.phone });
    setErrors({});
    setSaveError('');
    setShowSuccess(false);
    setMode('editar');
  };

  const set = (field: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const found: Partial<Form> = {};
    if (!form.firstName.trim()) found.firstName = 'El nombre es obligatorio.';
    if (!form.phone.trim()) found.phone = 'El teléfono es obligatorio.';
    else if (!PHONE.test(form.phone.trim())) found.phone = 'El teléfono no tiene un formato válido. Ej: +57 310 458 6721.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setSaveError('');
    try {
      const saved = await updateProfile({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() });
      setProfile(saved);
      updateUserProfile({ firstName: saved.firstName, lastName: saved.lastName ?? undefined, phone: saved.phone });
      setMode('ver');
      setShowSuccess(true);
    } catch (err: unknown) {
      // Escenario 2: nothing is saved and the profile keeps its previous data.
      setSaveError(err instanceof ApiError ? err.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[240px] shrink-0">
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 mb-5 shadow-xs">
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
              {isProvider ? 'Panel Profesional' : 'Mi cuenta'}
            </p>
            <p className="text-[#18211e] text-[17px] font-bold leading-snug truncate">
              {isProvider ? user?.businessName || fullName : fullName || user?.firstName}
            </p>
          </div>
          <SideNav items={sideNavItems} active={isProvider ? 'Perfil de Negocio' : 'Mi Perfil'} />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {showSuccess && mode === 'ver' && (
            <SuccessBanner
              title="Perfil actualizado con éxito"
              description="Usaremos estos datos para tus próximas notificaciones y comunicaciones."
              onDismiss={() => setShowSuccess(false)}
            />
          )}

          {loadError ? (
            <p role="alert" className="rounded-[10px] bg-[#fdf1f0] border border-[#f3c4be] px-5 py-4 text-[14px] text-[#b23b2e]">{loadError}</p>
          ) : !profile ? (
            <div className="text-center py-20" role="status">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
              <p className="mt-3 text-[#66716c] text-[14px]">Cargando tu perfil...</p>
            </div>
          ) : mode === 'ver' ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-[#18211e] text-[24px] font-bold">Información personal</h1>
                  <p className="text-[#66716c] text-[14px] mt-0.5">Consulta los datos asociados a tu cuenta.</p>
                </div>
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex items-center justify-center gap-2 border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] font-semibold text-[14px] px-4 py-[9px] rounded-[8px] transition-colors cursor-pointer w-fit"
                >
                  Editar perfil
                </button>
              </div>

              <div className="flex items-center gap-5 bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] px-6 py-5 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#005146] text-white flex items-center justify-center shrink-0 text-[20px] font-bold" aria-hidden="true">
                  {(profile.firstName.charAt(0) + (profile.lastName?.charAt(0) ?? '')).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[#18211e] text-[19px] font-bold truncate">{fullName}</p>
                  <p className="text-[#66716c] text-[13px]">{profile.role === 'PROVEEDOR' ? 'Cuenta de proveedor' : 'Cuenta de cliente'}</p>
                </div>
              </div>

              <SectionCard title="Datos personales y de contacto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ReadonlyField label="Nombre" value={profile.firstName} />
                  <ReadonlyField label="Apellido" value={profile.lastName ?? ''} />
                  <ReadonlyField label="Correo electrónico" value={profile.email} badge={profile.verified ? 'Verificado' : undefined} />
                  <ReadonlyField label="Teléfono" value={profile.phone} />
                </div>
                <p className="text-[#66716c] text-[12px] border-t border-[#ecefe9] pt-3">
                  Usaremos estos datos para confirmaciones, recordatorios y comunicaciones de tus reservas.
                </p>
              </SectionCard>
            </div>
          ) : (
            <form onSubmit={handleSave} noValidate className="flex flex-col gap-6">
              <div>
                <h1 className="text-[#18211e] text-[24px] font-bold">Editar perfil</h1>
                <p className="text-[#66716c] text-[14px] mt-0.5">Actualiza tus datos personales y de contacto.</p>
              </div>

              {saveError && (
                <p role="alert" className="rounded-[10px] bg-[#fdf1f0] border border-[#f3c4be] px-5 py-3 text-[14px] text-[#b23b2e]">
                  No se guardaron los cambios: {saveError}
                </p>
              )}

              <SectionCard title="Datos personales y de contacto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Nombre" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
                  <InputField label="Apellido" value={form.lastName} onChange={set('lastName')} />
                  <InputField
                    label="Correo electrónico"
                    type="email"
                    value={profile.email}
                    disabled
                    hint="El correo verificado no se puede cambiar."
                  />
                  <InputField label="Teléfono" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="+57 310 458 6721" />
                </div>
              </SectionCard>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setMode('ver')}
                  disabled={saving}
                  className="px-5 py-2.5 border border-[#d4d9d3] text-[#18211e] hover:bg-gray-100 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
