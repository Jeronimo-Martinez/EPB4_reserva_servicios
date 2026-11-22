import React, { useEffect, useState } from 'react';
import { NavBar } from '@/components/layout';
import ProviderAside from '@/components/layout/ProviderAside';
import { InputField, SelectField, SuccessBanner, TextareaField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { BusinessProfile, BusinessProfileUpdate, fetchBusinessProfile, updateBusinessProfile } from '@/api/business';
import { SERVICE_CATEGORIES } from '@/types/service';
import { categoryLabel } from '@/features/servicios/types';

/** HU-06 Actualización de perfil (negocios): "Perfil de mi negocio". */
type Form = BusinessProfileUpdate;
type Errors = Partial<Record<keyof Form, string>>;

const PHONE_RE = /^\+?[0-9()\- ]{7,20}$/;
const CATEGORY_OPTIONS = SERVICE_CATEGORIES.filter((c) => c !== 'Todas');

// The backend answers in plain ASCII; the UI shows the same messages with accents.
const FRIENDLY: Record<string, string> = {
  'La categoria no es valida': 'La categoría no es válida. Elige una de la lista.',
  'El telefono no tiene un formato valido': 'El teléfono no tiene un formato válido.',
  'La descripcion no puede superar 300 caracteres': 'La descripción no puede superar 300 caracteres.',
  'La direccion es obligatoria': 'La dirección es obligatoria.',
  'El nombre del negocio es obligatorio': 'El nombre del negocio es obligatorio.',
};

const toForm = (p: BusinessProfile): Form => ({
  name: p.name,
  category: p.category,
  description: p.description ?? '',
  address: p.address,
  phone: p.phone,
});

function validate(form: Form): Errors {
  const errors: Errors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'El nombre del negocio es obligatorio.';
  else if (name.length < 2 || name.length > 150) errors.name = 'El nombre debe tener entre 2 y 150 caracteres.';
  if (!form.category) errors.category = 'Selecciona una categoría.';
  if (!form.phone.trim()) errors.phone = 'El teléfono de contacto es obligatorio.';
  else if (!PHONE_RE.test(form.phone.trim())) errors.phone = 'Ingresa un teléfono válido, p. ej. +57 300 123 4567.';
  if (!form.address.trim()) errors.address = 'La dirección es obligatoria.';
  else if (form.address.trim().length > 255) errors.address = 'La dirección no puede superar 255 caracteres.';
  if (form.description.trim().length > 300) errors.description = 'La descripción no puede superar 300 caracteres.';
  return errors;
}

export default function PerfilNegocio() {
  const { updateUserProfile, openBusiness } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let current = true;
    setLoadError('');
    fetchBusinessProfile()
      .then((p) => {
        if (!current) return;
        setProfile(p);
        setForm(toForm(p));
      })
      .catch((err: unknown) => current && setLoadError(err instanceof ApiError ? err.message : 'Intenta de nuevo.'));
    return () => {
      current = false;
    };
  }, [reloadKey]);

  const set = (field: keyof Form) => (value: string) => {
    setForm((f) => (f ? { ...f, [field]: value } : f));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSaved(false);
    setSaveError('');
  };

  const dirty = !!profile && !!form && JSON.stringify(form) !== JSON.stringify(toForm(profile));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const found = validate(form);
    setErrors(found);
    setSaved(false);
    setSaveError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const updated = await updateBusinessProfile(form);
      setProfile(updated);
      setForm(toForm(updated));
      setSaved(true);
      // The side panel and nav read the business from the session: keep them in sync right away.
      updateUserProfile({ businessName: updated.name, businessCategory: updated.category });
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'No fue posible guardar los cambios.';
      setSaveError(message.split('; ').map((m) => FRIENDLY[m] ?? m).join(' '));
    } finally {
      setBusy(false);
    }
  }

  // An old or registration-style category (e.g. "SALUD_Y_BIENESTAR") still shows as selected.
  const categoryOptions = [
    ...(form && form.category && !CATEGORY_OPTIONS.includes(form.category as (typeof CATEGORY_OPTIONS)[number])
      ? [{ value: form.category, label: categoryLabel(form.category) }]
      : []),
    ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Perfil de Negocio" />
        <section className="flex-1 min-w-0 max-w-[760px] flex flex-col gap-5">
          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">Perfil de mi negocio</p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-tight mt-1">Información del negocio</h1>
            <p className="text-[#66716c] text-[14px] mt-1">
              Esta es la información que ven los clientes en el catálogo. Los cambios se publican al guardar.
            </p>
          </div>

          {loadError ? (
            <div role="alert" className="rounded-[10px] bg-[#fdf1f0] border border-[#f3c4be] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[#b23b2e] text-[14px]">No pudimos cargar tu negocio: {loadError}</p>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-[#005146] text-[13px] font-semibold underline bg-transparent cursor-pointer">
                Reintentar
              </button>
            </div>
          ) : !form || !profile ? (
            <div className="text-center py-16" role="status">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
              <p className="mt-3 text-[#66716c] text-[14px]">Cargando la información de tu negocio...</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              {saved && (
                <div className="flex flex-col gap-2">
                  <SuccessBanner
                    title="Cambios guardados"
                    description="La información de tu negocio se actualizó y los clientes ya la ven en el catálogo."
                    onDismiss={() => setSaved(false)}
                  />
                  <button
                    type="button"
                    onClick={() => openBusiness(profile.businessId)}
                    className="self-start text-[#005146] text-[13px] font-semibold underline bg-transparent cursor-pointer"
                  >
                    Ver cómo lo ven los clientes
                  </button>
                </div>
              )}
              {(saveError || Object.keys(errors).some((k) => errors[k as keyof Form])) && (
                <div role="alert" className="bg-[#fdf1f0] border border-[#f2bfbb] rounded-[8px] px-4 py-3">
                  <p className="text-[#d94f41] text-[13px] font-semibold">
                    {saveError || 'Revisa los campos marcados. No se guardó ningún cambio.'}
                  </p>
                </div>
              )}

              <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-5 sm:p-6 flex flex-col gap-5">
                <InputField label="Nombre del negocio" value={form.name} onChange={set('name')} error={errors.name} />
                <SelectField
                  label="Categoría"
                  value={form.category}
                  onChange={set('category')}
                  error={errors.category}
                  options={categoryOptions}
                  placeholder="Selecciona una categoría"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField
                    label="Correo electrónico de la cuenta"
                    type="email"
                    value={profile.email}
                    disabled
                    hint="Es el correo con el que inicias sesión; no se puede modificar."
                    trailing={
                      <span className="flex items-center gap-1 text-[#66716c] text-[11px]" aria-label="Solo lectura">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                          <path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Solo lectura
                      </span>
                    }
                  />
                  <InputField
                    label="Teléfono de contacto"
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    error={errors.phone}
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <InputField label="Dirección" value={form.address} onChange={set('address')} error={errors.address} />
                <TextareaField
                  label="Descripción del negocio"
                  value={form.description}
                  onChange={set('description')}
                  error={errors.description}
                  maxLength={300}
                  rows={4}
                  hint={`Explica qué ofrece tu negocio. ${form.description.length}/300 caracteres.`}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  disabled={!dirty || busy}
                  onClick={() => {
                    setForm(toForm(profile));
                    setErrors({});
                    setSaveError('');
                  }}
                  className="border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] rounded-[8px] px-5 py-2.5 text-[14px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Descartar cambios
                </button>
                <button
                  type="submit"
                  disabled={!dirty || busy}
                  className="bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] px-5 py-2.5 text-[14px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
