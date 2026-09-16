import React, { useState, useEffect } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Service, ServiceCategory, ServiceBookingRequest } from '@/types/service';
import { fetchAllServices, bookAppointment, getStoredBookings, saveStoredBookings } from '@/api/services';

const CATEGORIES: ServiceCategory[] = [
  'Todas',
  'Salud y Bienestar',
  'Belleza y Estética',
  'Entrenamiento Físico',
  'Reparaciones del Hogar',
  'Educación y Tutorías',
  'Tecnología y TI',
  'Consultoría Profesional',
];

interface CatalogoServiciosProps {
  initialView?: 'catalogo' | 'reservas';
}

export default function CatalogoServicios({ initialView = 'catalogo' }: CatalogoServiciosProps) {
  const { user, navigate, showNotification } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState(getStoredBookings());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [bookingForm, setBookingForm] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    notes: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await fetchAllServices();
      setServices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesCategory =
      selectedCategory === 'Todas' || srv.category === selectedCategory;
    const matchesQuery =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (srv.businessName && srv.businessName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleOpenBooking = (service: Service) => {
    setSelectedService(service);
  };

  const handleCloseBooking = () => {
    setSelectedService(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setBookingSubmitting(true);
    try {
      const req: ServiceBookingRequest = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        clientEmail: user?.email || 'cliente@ejemplo.com',
        clientName: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Cliente',
        date: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        notes: bookingForm.notes,
      };

      const result = await bookAppointment(req);
      showNotification('success', result.message);
      setSelectedService(null);
      setBookings(getStoredBookings());
      navigate('reservas');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo completar la reserva.';
      showNotification('error', msg);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const updated = bookings.filter((b) => b.id !== bookingId);
    saveStoredBookings(updated);
    setBookings(updated);
    showNotification('info', 'La reserva ha sido cancelada.');
  };

  const isReservasView = initialView === 'reservas';

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-10 py-8">
        {/* Banner superior promocional: SOLO cuando el usuario NO está logeado y en vista catálogo */}
        {!user && !isReservasView && (
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

        {/* Encabezado limpio para usuario logeado en catálogo */}
        {user && !isReservasView && (
          <div className="mb-6 animate-fade-in">
            <h1 className="text-[26px] md:text-[30px] font-bold text-[#18211e] tracking-tight">
              Catálogo de Servicios
            </h1>
            <p className="text-[#66716c] text-[14px] mt-1">
              Encuentra profesionales calificados y agenda tu cita al instante.
            </p>
          </div>
        )}

        {/* Encabezado para vista de reservas */}
        {isReservasView && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
            <div>
              <span className="inline-block bg-[#e6f0ef] text-[#005146] text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                Tus Citas
              </span>
              <h1 className="text-[26px] md:text-[30px] font-bold text-[#18211e] tracking-tight">
                Mis Reservas
              </h1>
              <p className="text-[#66716c] text-[14px] mt-1">
                Consulta los detalles de tus reservas confirmadas y administra tus citas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('catalogo')}
              className="inline-flex items-center gap-2 bg-[#005146] hover:bg-[#00403b] text-white font-medium px-4 py-2 rounded-[8px] transition-colors text-[14px] cursor-pointer shadow-xs w-fit"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Explorar catálogo
            </button>
          </div>
        )}

        {!isReservasView ? (
          <>
            {/* Barra de Búsqueda y Filtros */}
            <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-4 md:p-6 mb-8 shadow-xs flex flex-col gap-4">
              <div className="relative w-full">
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
                  type="text"
                  placeholder="Buscar por servicio, negocio o palabra clave (ej. Masaje, Plomería, Tutoría)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-[#d4d9d3] rounded-[8px] text-[15px] outline-none focus:border-[#005146] transition-colors text-[#18211e]"
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

              {/* Pastillas de Categorías */}
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

            {/* Lista de Servicios */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-bold text-[#18211e]">
                  {selectedCategory === 'Todas' ? 'Todos los servicios disponibles' : selectedCategory}
                  <span className="text-[#66716c] font-normal text-[15px] ml-2">
                    ({filteredServices.length} resultados)
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
                  <p className="mt-3 text-[#66716c] text-[14px]">Cargando servicios...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                services.length === 0 ? (
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
                ) : (
                  <EmptyState
                    icon={
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    }
                    title="No se encontraron servicios"
                    description={
                      searchQuery
                        ? `No encontramos resultados para "${searchQuery}". Intenta con otros términos o restablece los filtros.`
                        : `No hay servicios disponibles en la categoría "${selectedCategory}". Intenta explorando otras categorías.`
                    }
                    actionText="Restablecer filtros"
                    onAction={() => {
                      setSelectedCategory('Todas');
                      setSearchQuery('');
                    }}
                  />
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((srv) => (
                    <div
                      key={srv.id}
                      className="bg-[#fcfcf8] border border-[#d4d9d3] hover:border-[#005146]/50 rounded-[14px] p-6 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-[12px] font-semibold text-[#005146] bg-[#e6f0ef] px-2.5 py-1 rounded-full border border-[#b8d4d1]">
                            {srv.category}
                          </span>
                          {srv.rating && (
                            <div className="flex items-center gap-1 text-[13px] font-semibold text-[#18211e]">
                              <span className="text-amber-500">★</span>
                              <span>{srv.rating.toFixed(1)}</span>
                              <span className="text-[#66716c] text-[12px]">({srv.reviewsCount})</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-[18px] font-bold text-[#18211e] leading-snug mt-2">
                          {srv.name}
                        </h3>
                        <p className="text-[13px] font-medium text-[#66716c] mt-0.5">
                          Por: <strong className="text-[#18211e]">{srv.businessName || 'Profesional certificado'}</strong>
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
                              ${srv.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenBooking(srv)}
                          disabled={!srv.isAvailable}
                          className={`w-full py-2.5 rounded-[8px] text-[14px] font-semibold transition-all duration-150 flex items-center justify-center gap-2 active:scale-95
                            ${
                              srv.isAvailable
                                ? 'bg-[#005146] hover:bg-[#00403b] text-white cursor-pointer'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                          {srv.isAvailable ? (
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
          </>
        ) : (
          /* Vista: Mis Reservas */
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[22px] font-bold text-[#18211e]">
                Mis Reservas Agendadas
              </h2>
              <span className="text-[14px] text-[#66716c]">
                {bookings.length} reserva{bookings.length === 1 ? '' : 's'} en total
              </span>
            </div>

            {bookings.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
                title="Aún no tienes citas agendadas"
                description="Explora nuestro catálogo para descubrir profesionales calificados y agendar tu primera cita cuando lo necesites."
                actionText="Explorar catálogo de servicios"
                onAction={() => navigate('catalogo')}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#e6f0ef] text-[#005146] border border-[#b8d4d1]">
                          ● {b.status}
                        </span>
                        <span className="text-[13px] text-[#66716c]">
                          Cliente: <strong>{b.clientName}</strong>
                        </span>
                      </div>

                      <h3 className="text-[18px] font-bold text-[#18211e]">
                        {b.serviceName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-[13px] text-[#66716c]">
                        <span className="flex items-center gap-1.5">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          Fecha: <strong className="text-[#18211e]">{b.date}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                          </svg>
                          Hora: <strong className="text-[#18211e]">{b.timeSlot}</strong>
                        </span>
                        {b.notes && (
                          <span className="text-gray-500 italic">
                            "{b.notes}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b.id)}
                        className="px-4 py-2 border border-[#d4d9d3] hover:border-red-400 text-red-600 hover:bg-red-50 text-[13px] font-semibold rounded-[8px] transition-colors cursor-pointer"
                      >
                        Cancelar cita
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Reserva de Cita */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-modal-backdrop">
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[16px] max-w-[500px] w-full p-6 md:p-8 shadow-2xl relative animate-modal-pop">
            <button
              type="button"
              onClick={handleCloseBooking}
              className="absolute top-5 right-5 text-[#66716c] hover:text-[#18211e] p-1 rounded-full cursor-pointer bg-transparent border-none"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <span className="text-[#005146] text-[12px] font-bold uppercase tracking-wider block mb-1">
              Agendar Servicio
            </span>
            <h3 className="text-[22px] font-bold text-[#18211e] mb-1">
              {selectedService.name}
            </h3>
            <p className="text-[13px] text-[#66716c] mb-6">
              Ofrecido por: <strong className="text-[#18211e]">{selectedService.businessName}</strong>
            </p>

            <form onSubmit={handleConfirmBooking} className="flex flex-col gap-4">
              <div className="bg-[#f2f3ee] p-4 rounded-[10px] flex justify-between items-center text-[14px]">
                <div>
                  <span className="text-[#66716c] block text-[12px]">Duración estimada</span>
                  <strong className="text-[#18211e]">{selectedService.durationMinutes} minutos</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#66716c] block text-[12px]">Total a pagar</span>
                  <strong className="text-[#005146] text-[18px]">${selectedService.price.toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#18211e] mb-1">
                  Fecha de la cita
                </label>
                <input
                  type="date"
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d4d9d3] rounded-[8px] text-[14px] text-[#18211e] focus:border-[#005146] outline-none"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#18211e] mb-1">
                  Horario preferido
                </label>
                <select
                  value={bookingForm.timeSlot}
                  onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d4d9d3] rounded-[8px] text-[14px] text-[#18211e] focus:border-[#005146] outline-none"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-[#18211e] mb-1">
                  Notas o detalles adicionales (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones específicas o requerimientos..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d4d9d3] rounded-[8px] text-[14px] text-[#18211e] focus:border-[#005146] outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseBooking}
                  className="flex-1 py-2.5 border border-[#d4d9d3] text-[#18211e] hover:bg-gray-100 rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="flex-1 py-2.5 bg-[#005146] hover:bg-[#00403b] text-white rounded-[8px] text-[14px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-60 active:scale-95"
                >
                  {bookingSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
