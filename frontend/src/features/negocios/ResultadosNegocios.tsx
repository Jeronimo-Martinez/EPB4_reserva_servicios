import { FormEvent, useEffect, useState } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState, RatingBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { BusinessDetail, searchBusinesses } from '@/api/services';
import { categoryLabel } from '@/features/servicios/types';
import BusinessAvatar from './BusinessAvatar';

export default function ResultadosNegocios() {
  const { openBusiness } = useAuth();
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [results, setResults] = useState<BusinessDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    searchBusinesses(applied)
      .then((res) => current && setResults(res))
      .catch((err: unknown) => current && setError(err instanceof ApiError ? err.message : 'No fue posible buscar negocios.'))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [applied]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setApplied(query.trim());
  };

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-[680px] mx-auto px-6 py-8 flex flex-col gap-5">
        <div>
          <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">Descubre negocios</p>
          <h1 className="text-[#18211e] text-[24px] font-bold leading-tight mt-1">Resultados de búsqueda</h1>
          <p className="text-[#66716c] text-[14px] mt-1">Encuentra el servicio ideal cerca de ti.</p>
        </div>

        <form onSubmit={submit} role="search" className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por negocio, servicio o zona"
            aria-label="Buscar negocios"
            className="flex-1 bg-white border border-[#d4d9d3] focus:border-[#005146] rounded-[8px] px-4 py-[10px] text-[14px] text-[#18211e] outline-none transition-colors"
          />
          <button
            type="submit"
            className="border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[13px] px-4 rounded-[8px] transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center justify-between border-b border-[#d4d9d3] pb-3">
          <h2 className="text-[#18211e] text-[16px] font-semibold">Negocios encontrados</h2>
          {!loading && !error && (
            <span className="text-[#66716c] text-[12px]">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-14">
            <div className="inline-block animate-spin w-7 h-7 border-4 border-[#005146] border-t-transparent rounded-full" />
            <p className="mt-3 text-[#66716c] text-[14px]">Buscando negocios...</p>
          </div>
        ) : error ? (
          <p role="alert" className="text-[#d94f41] text-[14px]">{error}</p>
        ) : results.length === 0 ? (
          <EmptyState
            title="No encontramos negocios"
            description={`No hay negocios que coincidan con “${applied}”. Prueba con otro término.`}
            actionText="Ver todos los negocios"
            onAction={() => {
              setQuery('');
              setApplied('');
            }}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {results.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => openBusiness(b.id)}
                  className="w-full text-left bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146]/60 rounded-[12px] px-4 py-4 flex items-center gap-4 shadow-xs transition-colors cursor-pointer"
                >
                  <BusinessAvatar />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[#18211e] text-[17px] font-semibold leading-tight">{b.name}</p>
                      <RatingBadge average={b.averageRating} count={b.reviewCount} />
                    </div>
                    <p className="text-[#66716c] text-[12px] mt-0.5">{categoryLabel(b.category)}</p>
                    {b.description && <p className="text-[#66716c] text-[13px] mt-2 line-clamp-2">{b.description}</p>}
                    <p className="text-[#005146] text-[12px] font-semibold mt-2">Ver negocio</p>
                  </div>
                  <span className="text-[#66716c] text-[20px]" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
