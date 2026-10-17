import { useEffect, useState } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState, RatingBadge } from '@/components/ui';
import { AppView, useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { BusinessDetail, fetchBusiness } from '@/api/services';
import { IniciarReservaModal } from '@/features/reservas';
import { categoryLabel } from '@/features/servicios/types';
import { Service } from '@/types/service';
import { cop } from '@/utils/dates';
import BusinessAvatar from './BusinessAvatar';

const BACK_LABELS: Partial<Record<AppView, string>> = {
  negocios: 'Volver a resultados',
  catalogo: 'Volver al catálogo',
};

const ICONS = {
  ubicacion: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" /></>,
  telefono: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  correo: <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" /></>,
};

export default function DetalleNegocio() {
  const { selectedBusinessId, businessReturnView, navigate } = useAuth();
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Service | null>(null);

  useEffect(() => {
    if (!selectedBusinessId) {
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    fetchBusiness(selectedBusinessId)
      .then((res) => current && setBusiness(res))
      .catch((err: unknown) => current && setError(err instanceof ApiError ? err.message : 'No fue posible cargar el negocio.'))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [selectedBusinessId]);

  const goBack = () => navigate(BACK_LABELS[businessReturnView] ? businessReturnView : 'negocios');

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-[840px] mx-auto px-6 py-8 flex flex-col gap-6">
        <button
          type="button"
          onClick={goBack}
          className="self-start flex items-center gap-1.5 text-[#66716c] hover:text-[#18211e] text-[13px] cursor-pointer bg-transparent"
        >
          <span aria-hidden="true">‹</span> {BACK_LABELS[businessReturnView] ?? 'Volver a resultados'}
        </button>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin w-7 h-7 border-4 border-[#005146] border-t-transparent rounded-full" />
            <p className="mt-3 text-[#66716c] text-[14px]">Cargando negocio...</p>
          </div>
        ) : !business ? (
          <EmptyState
            title="No encontramos este negocio"
            description={error || 'Busca un negocio para ver su información y sus servicios.'}
            actionText="Buscar negocios"
            onAction={() => navigate('negocios')}
          />
        ) : (
          <>
            <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] shadow-xs p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <BusinessAvatar size={64} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-block text-[11px] text-[#66716c] bg-[#ecefe9] px-2 py-1 rounded-[4px] font-medium">
                      {categoryLabel(business.category)}
                    </span>
                    <RatingBadge average={business.averageRating} count={business.reviewCount} long />
                  </div>
                  <h1 className="text-[#18211e] text-[26px] font-bold leading-tight mt-2">{business.name}</h1>
                  {business.description && <p className="text-[#66716c] text-[14px] mt-2 max-w-[560px]">{business.description}</p>}
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-[#ecefe9]">
                {[
                  { key: 'ubicacion' as const, label: 'Ubicación', value: business.address },
                  { key: 'telefono' as const, label: 'Teléfono', value: business.phone, href: `tel:${business.phone}` },
                  { key: 'correo' as const, label: 'Correo electrónico', value: business.email, href: `mailto:${business.email}` },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center shrink-0">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">{ICONS[item.key]}</svg>
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[#66716c] text-[11px]">{item.label}</dt>
                      <dd className="text-[#18211e] text-[13px] font-medium break-words">
                        {item.href ? <a href={item.href} className="hover:text-[#005146]">{item.value}</a> : item.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-end justify-between border-b border-[#d4d9d3] pb-3">
                <div>
                  <h2 className="text-[#18211e] text-[20px] font-bold">Servicios disponibles</h2>
                  <p className="text-[#66716c] text-[13px] mt-0.5">Selecciona un servicio para iniciar tu reserva.</p>
                </div>
                <span className="text-[#66716c] text-[12px]">
                  {business.services.length} {business.services.length === 1 ? 'servicio' : 'servicios'}
                </span>
              </div>

              {business.services.length === 0 ? (
                <p className="text-[#66716c] text-[14px] py-6 text-center">Este negocio todavía no ha publicado servicios.</p>
              ) : (
                business.services.map((s) => (
                  <article
                    key={s.id}
                    className={`bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-xs ${s.available ? '' : 'opacity-75'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[#18211e] text-[16px] font-semibold">{s.name}</h3>
                      {s.description && <p className="text-[#66716c] text-[13px] mt-1">{s.description}</p>}
                      <p className="flex items-center gap-1.5 text-[#66716c] text-[12px] mt-2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {s.durationMinutes} min
                      </p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <p className="text-[#18211e] text-[16px] font-bold">{cop(s.price)}</p>
                      {s.available ? (
                        <button
                          type="button"
                          onClick={() => setSelected(s)}
                          className="border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] font-semibold text-[13px] px-5 py-2 rounded-[8px] transition-colors cursor-pointer bg-transparent"
                        >
                          Reservar
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="border border-[#d4d9d3] text-[#66716c] bg-[#ecefe9] font-semibold text-[12px] px-3 py-2 rounded-[8px] cursor-not-allowed"
                        >
                          No disponible por el momento
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </main>

      {selected && <IniciarReservaModal service={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
