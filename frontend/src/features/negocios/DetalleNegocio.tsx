import React, { useState } from 'react';
import { NavBar } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { BusinessInfo } from '@/types/booking';
import negocioImage from '@/assets/images/03295ad43b390c2dd1d392172801409465bdc5e6.png';

interface ServicioNegocio {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  duracionMin: number;
  precio: number;
  precioStr: string;
}

const SERVICIOS_CENTRO_VITAL: ServicioNegocio[] = [
  {
    id: 'corte',
    nombre: 'Corte y estilizado',
    descripcion: 'Corte personalizado con lavado y estilizado utilizando productos premium.',
    duracion: '45 min',
    duracionMin: 45,
    precio: 45000,
    precioStr: '$45.000',
  },
  {
    id: 'coloracion',
    nombre: 'Coloración completa',
    descripcion: 'Diagnóstico de color, aplicación profesional y tratamiento de hidratación.',
    duracion: '120 min',
    duracionMin: 120,
    precio: 135000,
    precioStr: '$135.000',
  },
  {
    id: 'tratamiento',
    nombre: 'Tratamiento capilar',
    descripcion: 'Hidratación profunda para recuperar brillo, suavidad y vitalidad.',
    duracion: '60 min',
    duracionMin: 60,
    precio: 75000,
    precioStr: '$75.000',
  },
  {
    id: 'nutricion',
    nombre: 'Consulta nutricional',
    descripcion: 'Evaluación de composición corporal, metas y plan de alimentación personalizado.',
    duracion: '60 min',
    duracionMin: 60,
    precio: 60000,
    precioStr: '$60.000',
  },
];

const CATEGORIAS = ['Todas', 'Belleza y Estilismo', 'Salud y Bienestar', 'Tecnología y TI'];
const UBICACIONES = ['Todas', 'Zona Norte', 'Chapinero', 'Salitre'];

export default function DetalleNegocio() {
  const { navigate } = useAuth();
  const { businesses, selectedBusiness, setSelectedBusiness, setSelectedServiceForBooking } = useBooking();

  const [vista, setVista] = useState<'resultados' | 'detalle'>('resultados');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedLocation, setSelectedLocation] = useState('Todas');
  const [activeServiceForModal, setActiveServiceForModal] = useState<ServicioNegocio | null>(null);

  // HU 3.1.1: Búsqueda combinada por término, categoría y ubicación
  const filteredBusinesses = businesses.filter((biz) => {
    const matchTerm =
      searchTerm === '' ||
      biz.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = selectedCategory === 'Todas' || biz.category.includes(selectedCategory);
    const matchLocation = selectedLocation === 'Todas' || biz.location.includes(selectedLocation);

    return matchTerm && matchCategory && matchLocation;
  });

  const handleOpenDetail = (biz: BusinessInfo) => {
    setSelectedBusiness(biz);
    setVista('detalle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartBooking = (service: ServicioNegocio) => {
    setSelectedServiceForBooking(service);
    navigate('disponibilidad');
  };

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      {vista === 'resultados' ? (
        <main className="flex-1 w-full max-w-[1080px] mx-auto px-5 md:px-8 py-10 animate-fade-in">
          <div className="max-w-[720px]">
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
              Descubre negocios (HU 3.1.1)
            </p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.56px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
              Búsqueda de negocios y servicios
            </h1>
            <p className="text-[#66716c] text-[14px] leading-[20px] mt-1">
              Encuentra opciones que se ajusten a tus necesidades combinando nombre, categoría o ubicación.
            </p>
          </div>

          {/* Barra de Búsqueda y Filtros Combinados (HU 3.1.1) */}
          <div className="mt-6 flex flex-col md:flex-row gap-3 max-w-[820px]">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66716c]">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, especialidad o palabra clave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#fcfcf8] border border-[#d4d9d3] rounded-[8px] py-2.5 pl-10 pr-4 text-[#18211e] text-[14px] outline-none focus:border-[#005146]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[8px] px-3 py-2 text-[13px] text-[#18211e] outline-none focus:border-[#005146]"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c === 'Todas' ? 'Todas las categorías' : c}
                  </option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[8px] px-3 py-2 text-[13px] text-[#18211e] outline-none focus:border-[#005146]"
              >
                {UBICACIONES.map((u) => (
                  <option key={u} value={u}>
                    {u === 'Todas' ? 'Todas las ubicaciones' : u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="mt-8 max-w-[820px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#d4d9d3]">
              <h2 className="text-[#18211e] text-[18px] font-bold" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                Negocios encontrados
              </h2>
              <span className="text-[#66716c] text-[12px] font-medium">
                {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>

            {filteredBusinesses.length === 0 ? (
              <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-8 text-center mt-4">
                <div className="w-12 h-12 rounded-full bg-[#e5e8e1] flex items-center justify-center mx-auto text-[#66716c] mb-3">
                  🔍
                </div>
                <h3 className="text-[#18211e] text-[16px] font-bold mb-1">
                  Ningún negocio o servicio coincide con tu búsqueda
                </h3>
                <p className="text-[#66716c] text-[13px] max-w-[420px] mx-auto">
                  Prueba modificando los filtros de categoría o ubicación, o usando un término de búsqueda más general.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('Todas');
                    setSelectedLocation('Todas');
                  }}
                  className="mt-4 px-4 py-2 border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] text-[13px] font-semibold rounded-[8px] transition-colors cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                {filteredBusinesses.map((biz) => (
                  <article
                    key={biz.id}
                    onClick={() => handleOpenDetail(biz)}
                    className="w-full bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146] hover:shadow-md rounded-[14px] p-5 flex items-start sm:items-center gap-4 text-left transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-[#d4d9d3] shrink-0 bg-[#e5e8e1]">
                      {biz.imageUrl ? (
                        <img src={biz.imageUrl} alt={biz.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[#66716c] text-[18px]">
                          {biz.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                        <div>
                          <h3 className="text-[#18211e] text-[19px] font-bold leading-[26px] group-hover:text-[#005146] transition-colors" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                            {biz.name}
                          </h3>
                          <span className="inline-block bg-[#e5e8e1] text-[#66716c] text-[11px] font-semibold px-2 py-0.5 rounded-xs mt-1">
                            {biz.category}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[#18211e] text-[13px] font-semibold">
                          ⭐ {biz.rating} <span className="text-[#66716c] font-normal">({biz.reviewCount})</span>
                        </span>
                      </div>

                      <p className="text-[#66716c] text-[13px] leading-[19px] mt-2 line-clamp-2">
                        {biz.description}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-[12px] text-[#66716c]">
                        <span className="flex items-center gap-1">
                          📍 {biz.location}
                        </span>
                        <span className="text-[#005146] font-semibold group-hover:underline">
                          Ver servicios disponibles →
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* VISTA DETALLE DEL NEGOCIO (HU 3.1.2) */
        <main className="flex-1 w-full max-w-[1080px] mx-auto px-5 md:px-8 py-8 md:py-10 animate-fade-in">
          <button
            type="button"
            onClick={() => setVista('resultados')}
            className="flex items-center gap-1.5 text-[#66716c] hover:text-[#18211e] text-[13px] font-medium transition-colors cursor-pointer bg-transparent border-none mb-4"
          >
            ← Volver a resultados de búsqueda
          </button>

          {/* Tarjeta de información principal del negocio (HU 3.1.2) */}
          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 md:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-[#d4d9d3] shrink-0 bg-[#e5e8e1]">
                {selectedBusiness.imageUrl ? (
                  <img src={selectedBusiness.imageUrl} alt={selectedBusiness.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#66716c] text-[22px]">
                    {selectedBusiness.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex bg-[#e5e8e1] text-[#66716c] text-[11px] font-semibold rounded-[4px] px-2.5 py-1 mb-2">
                      {selectedBusiness.category}
                    </span>
                    <h1 className="text-[#18211e] text-[28px] md:text-[32px] font-bold leading-[38px] tracking-[-0.6px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                      {selectedBusiness.name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-1 text-[#18211e] text-[14px] font-semibold pt-1">
                    ⭐ {selectedBusiness.rating} <span className="text-[#66716c] font-normal">({selectedBusiness.reviewCount} reseñas)</span>
                  </div>
                </div>

                <p className="text-[#66716c] text-[14px] leading-[22px] mt-3 max-w-[680px]">
                  {selectedBusiness.description}
                </p>
              </div>
            </div>

            {/* Datos de contacto y ubicación requeridos por HU 3.1.2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-6 mt-6 border-t border-[#e2e5df]">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center shrink-0">📍</div>
                <div>
                  <p className="text-[#66716c] text-[11px] font-medium">Ubicación</p>
                  <p className="text-[#18211e] text-[13px] font-semibold mt-0.5">{selectedBusiness.location}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center shrink-0">📞</div>
                <div>
                  <p className="text-[#66716c] text-[11px] font-medium">Teléfono de contacto</p>
                  <p className="text-[#18211e] text-[13px] font-semibold mt-0.5">{selectedBusiness.phone}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center shrink-0">✉️</div>
                <div>
                  <p className="text-[#66716c] text-[11px] font-medium">Correo electrónico</p>
                  <p className="text-[#18211e] text-[13px] font-semibold mt-0.5">{selectedBusiness.email}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Lista de servicios ofrecidos (HU 3.1.2) */}
          <section className="mt-8">
            <div className="flex items-end justify-between pb-3 border-b border-[#d4d9d3]">
              <div>
                <h2 className="text-[#18211e] text-[22px] font-bold leading-[30px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                  Servicios disponibles
                </h2>
                <p className="text-[#66716c] text-[13px] mt-0.5">
                  Selecciona uno de los servicios para consultar fechas y horarios disponibles para tu cita.
                </p>
              </div>
              <span className="text-[#66716c] text-[12px] font-medium">
                {SERVICIOS_CENTRO_VITAL.length} servicios
              </span>
            </div>

            <div className="flex flex-col gap-3.5 mt-4">
              {SERVICIOS_CENTRO_VITAL.map((servicio) => (
                <article
                  key={servicio.id}
                  className="bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146] rounded-[12px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                      <h3 className="text-[#18211e] text-[18px] font-bold" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                        {servicio.nombre}
                      </h3>
                      <span className="text-[#005146] text-[16px] font-bold">
                        {servicio.precioStr}
                      </span>
                    </div>

                    <p className="text-[#66716c] text-[13px] leading-[19px]">
                      {servicio.descripcion}
                    </p>

                    <div className="flex items-center gap-1.5 text-[#66716c] text-[12px] mt-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      Duración estimada: <strong className="text-[#18211e]">{servicio.duracion}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveServiceForModal(servicio)}
                    className="border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] font-semibold text-[14px] px-6 py-2.5 rounded-[8px] transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                  >
                    Reservar
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* Modal para iniciar la reserva (HU 3.1.2) */}
          {activeServiceForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-modal-backdrop">
              <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] shadow-2xl w-full max-w-[460px] p-6 relative animate-modal-pop">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]">
                      {selectedBusiness.name}
                    </p>
                    <h3 className="text-[#18211e] text-[22px] font-bold mt-1" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                      Inicia tu reserva
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveServiceForModal(null)}
                    className="w-8 h-8 rounded-full border border-[#d4d9d3] flex items-center justify-center text-[#66716c] hover:text-[#18211e] bg-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#f2f3ee] border border-[#d4d9d3] rounded-[10px] p-4 mt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[#18211e] text-[15px] font-bold">{activeServiceForModal.nombre}</p>
                      <p className="text-[#66716c] text-[12px] mt-0.5">Duración: {activeServiceForModal.duracion}</p>
                    </div>
                    <p className="text-[#005146] text-[16px] font-bold">{activeServiceForModal.precioStr}</p>
                  </div>
                </div>

                <p className="text-[#66716c] text-[13px] leading-[20px] mt-4">
                  El servicio está pre-seleccionado. Ahora podrás elegir una fecha y horario disponible en la agenda del proveedor.
                </p>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveServiceForModal(null)}
                    className="border border-[#d4d9d3] text-[#18211e] font-medium text-[13px] px-4 py-2 rounded-[8px] hover:bg-gray-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartBooking(activeServiceForModal)}
                    className="bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[13px] px-5 py-2 rounded-[8px] transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    Elegir fecha y hora →
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
