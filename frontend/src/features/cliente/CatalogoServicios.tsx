import React, { useState, useEffect } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState, RatingBadge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Service, ServiceCategory, SERVICE_CATEGORIES } from '@/types/service';
import { fetchCatalogServices } from '@/api/services';
import { IniciarReservaModal } from '@/features/reservas';
import { categoryLabel } from '@/features/servicios/types';

const CATEGORIES = SERVICE_CATEGORIES;
const SEARCH_DEBOUNCE_MS = 300;

export default function CatalogoServicios() {
  const { user, navigate, openBusiness, catalogCategory } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>(
    (catalogCategory as ServiceCategory) || 'Todas'
  );
  const [searchQuery, setSearchQuery] = useState('');
  // The backend filters, so requests wait for the user to stop typing.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setFailed(false);
    fetchCatalogServices(debouncedQuery, selectedCategory)
      .then((data) => {
        if (!current) return;
        setServices(data.items || []);
        setTotal(data.total ?? (data.items?.length || 0));
      })
      .catch((e) => {
        if (!current) return;
        console.error(e);
        setFailed(true);
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
    // catalogCategory seeds the first selection; later changes come from the chips.
  }, [debouncedQuery, selectedCategory]);

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-10 py-8">
        {!user && (
          <div className="bg-[#005146] text-white rounded-[16px] p-8 md:p-10 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in">
            <div className="max-w-[650px]">
              <span className="inline-block bg-[#006e5f] text-emerald-100 text-[12px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                Marketplace de Servicios
              </span>
              <h1 className="text-[28px] md:text-[34px] font-bold leading-tight">
                Encuentra y agenda con los mejores profesionales
              </h1>
              <p className="text-emerald-100 text-[15px] mt-2">
                Servicios garantizados, precios transparentes y reservas en tiempo real.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => navigate('registro-proveedor')}
                className="bg-[#006e5f] hover:bg-[#007f6e] text-white border border-emerald-400/40 font-semibold px-5 py-3 rounded-[8px] transition-colors text-center text-[14px] cursor-pointer shadow-xs shrink-0"
              >
                ¿Ofreces servicios? Regístrate aquí
              </button>
            </div>
          </div>
        )}

        {user && (
          <div className="mb-6 animate-fade-in">
            <h1 className="text-[26px] md:text-[30px] font-bold text-[#18211e] tracking-tight">
              Catálogo de Servicios
            </h1>
            <p className="text-[#66716c] text-[14px] mt-1">
              Encuentra profesionales calificados y agenda tu cita al instante.
            </p>
          </div>
        )}

        <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-4 md:p-6 mb-8 shadow-xs flex flex-col gap-4">
          <form
            role="search"
            className="relative w-full flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              // Enter or the button runs the search right away instead of waiting for the debounce.
              setDebouncedQuery(searchQuery);
            }}
          >
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#66716c]"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Buscar por servicio, negocio o palabra clave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar servicios"
                className="w-full pl-12 pr-16 py-3 bg-white border border-[#d4d9d3] rounded-[8px] text-[15px] outline-none focus:border-[#005146] transition-colors text-[#18211e]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#66716c] hover:text-[#18211e] text-[13px] bg-transparent border-none cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
            <button
              type="submit"
              className="shrink-0 bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-5 rounded-[8px] transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer border
                    ${
                      active
                        ? 'bg-[#005146] text-white border-[#005146] shadow-xs'
                        : 'bg-white text-[#66716c] border-[#d4d9d3] hover:border-[#005146] hover:text-[#18211e]'
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-[#18211e]">
              {selectedCategory === 'Todas' ? 'Todos los servicios disponibles' : selectedCategory}
              <span className="text-[#66716c] font-normal text-[15px] ml-2">
                ({loading ? '…' : total} resultados)
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
              <p className="mt-3 text-[#66716c] text-[14px]">Cargando servicios...</p>
            </div>
          ) : failed ? (
            <EmptyState
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              }
              title="No pudimos cargar los servicios"
              description="Ocurrió un problema al consultar el catálogo. Intenta de nuevo en unos segundos."
              actionText="Reintentar"
              onAction={() => setDebouncedQuery(searchQuery)}
            />
          ) : services.length === 0 ? (
            debouncedQuery || selectedCategory !== 'Todas' ? (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
                title="No se encontraron servicios"
                description={
                  debouncedQuery
                    ? `No encontramos resultados para "${debouncedQuery}". Intenta con otros términos o restablece los filtros.`
                    : `No hay servicios disponibles en la categoría "${selectedCategory}". Intenta explorando otras categorías.`
                }
                actionText="Restablecer filtros"
                onAction={() => {
                  setSelectedCategory('Todas');
                  setSearchQuery('');
                  setDebouncedQuery('');
                }}
              />
            ) : (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
                title="Aún no hay servicios disponibles"
                description="Los profesionales están configurando sus servicios en la plataforma. Muy pronto encontrarás opciones para reservar."
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146]/50 rounded-[14px] p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-[12px] font-semibold text-[#005146] bg-[#e6f0ef] px-2.5 py-1 rounded-full border border-[#b8d4d1]">
                        {categoryLabel(srv.category)}
                      </span>
                      <RatingBadge average={srv.averageRating ?? 0} count={srv.reviewCount ?? 0} />
                    </div>

                    <h3 className="text-[18px] font-bold text-[#18211e] leading-snug mt-2">
                      {srv.name}
                    </h3>
                    <p className="text-[13px] font-medium text-[#66716c] mt-0.5">
                      Por:{' '}
                      {srv.businessId ? (
                        <button
                          type="button"
                          onClick={() => openBusiness(srv.businessId!)}
                          className="font-bold text-[#18211e] hover:text-[#005146] underline-offset-2 hover:underline cursor-pointer bg-transparent"
                        >
                          {srv.businessName}
                        </button>
                      ) : (
                        <strong className="text-[#18211e]">{srv.businessName || 'Profesional certificado'}</strong>
                      )}
                    </p>

                    <p className="text-[#66716c] text-[14px] leading-relaxed mt-3 line-clamp-3">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-[#ecefe9]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-[#66716c] text-[13px]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span>{srv.durationMinutes} min</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[12px] text-[#66716c] block">Precio</span>
                        <span className="text-[20px] font-bold text-[#005146]">
                          ${srv.price.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingService(srv)}
                      disabled={!srv.available}
                      className={`w-full py-2.5 rounded-[8px] text-[14px] font-semibold transition-all duration-150 flex items-center justify-center gap-2 active:scale-95
                        ${
                          srv.available
                            ? 'bg-[#005146] hover:bg-[#00403b] text-white cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                    >
                      {srv.available ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          Reservar cita
                        </>
                      ) : (
                        'No disponible por el momento'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {bookingService && <IniciarReservaModal service={bookingService} onClose={() => setBookingService(null)} />}
    </div>
  );
}
