import { useState, useMemo } from 'react';
import { NavBar } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';

export interface SeleccionCita {
  servicioId: string;
  servicioNombre: string;
  duracionMin: number;
  precio: number;
  negocioNombre: string;
  negocioUbicacion: string;
  fecha: string;
  fechaLegible: string;
  hora: string;
}

export default function DisponibilidadServicio({
  onContinuarDirecto,
  horarioNoDisponible,
}: {
  onContinuarDirecto?: (sel: SeleccionCita) => void;
  horarioNoDisponible?: { fecha: string; hora: string } | null;
}) {
  const { navigate } = useAuth();
  const { hours, blockouts, reservations, selectedBusiness, selectedServiceForBooking, setSelectedServiceForBooking } = useBooking();

  // Servicio activo (fallback si entra directo)
  const currentService = selectedServiceForBooking || {
    id: 'corte',
    nombre: 'Corte y estilizado',
    duracion: '45 min',
    duracionMin: 45,
    precio: 45000,
  };

  // Selector de periodo (para demostrar HU 3.1.3: aviso si no hay disponibilidad próxima)
  const [periodo, setPeriodo] = useState<'octubre' | 'noviembre'>('octubre');

  // Fechas de demostración en Octubre
  const FECHAS_OCTUBRE = useMemo(
    () => [
      { fecha: '2026-10-22', dia: 22, semana: 'Jue', etiqueta: 'Jueves, 22 de octubre' },
      { fecha: '2026-10-23', dia: 23, semana: 'Vie', etiqueta: 'Viernes, 23 de octubre' },
      { fecha: '2026-10-24', dia: 24, semana: 'Sáb', etiqueta: 'Sábado, 24 de octubre' },
      { fecha: '2026-10-26', dia: 26, semana: 'Lun', etiqueta: 'Lunes, 26 de octubre' },
      { fecha: '2026-10-27', dia: 27, semana: 'Mar', etiqueta: 'Martes, 27 de octubre' },
    ],
    []
  );

  const [fechaSeleccionada, setFechaSeleccionada] = useState(FECHAS_OCTUBRE[0].fecha);
  const [horaSeleccionada, setHoraSeleccionada] = useState(horarioNoDisponible ? '' : '10:00');

  // Franjas horarias base
  const HORARIOS_BASE = ['08:30', '09:15', '10:00', '11:00', '11:45', '14:00', '15:00', '16:00', '16:45'];

  // HU 3.1.3: Calcular horarios respetando bloqueos, reservas previas y configuración del proveedor
  const horariosDisponibles = useMemo(() => {
    if (periodo === 'noviembre') return []; // Para simular periodo sin disponibilidad

    return HORARIOS_BASE.filter((hora) => {
      // 1. Verificar si hay un horario bloqueado
      const estaBloqueado = blockouts.some((b) => {
        if (b.fecha !== fechaSeleccionada) return false;
        if (!b.horaInicio) return true; // Todo el día bloqueado
        return hora >= b.horaInicio && (!b.horaFin || hora < b.horaFin);
      });
      if (estaBloqueado) return false;

      // 2. Verificar si ya hay una reserva activa en esa fecha y hora
      const estaReservado = reservations.some(
        (r) => r.date === fechaSeleccionada && r.timeSlot === hora && r.status !== 'CANCELADA'
      );
      if (estaReservado) return false;

      // 3. Simular conflicto si se pasó por props
      if (horarioNoDisponible && horarioNoDisponible.fecha === fechaSeleccionada && horarioNoDisponible.hora === hora) {
        return false;
      }

      return true;
    });
  }, [periodo, fechaSeleccionada, blockouts, reservations, horarioNoDisponible]);

  const fechaObj = FECHAS_OCTUBRE.find((f) => f.fecha === fechaSeleccionada);

  const handleContinuar = () => {
    if (!horaSeleccionada || !fechaObj) return;

    const seleccion: SeleccionCita = {
      servicioId: currentService.id,
      servicioNombre: currentService.nombre,
      duracionMin: currentService.duracionMin || 45,
      precio: currentService.precio || 45000,
      negocioNombre: selectedBusiness?.name || 'Centro Vital',
      negocioUbicacion: selectedBusiness?.location || 'Calle 93 #14-28, Zona Norte, Bogotá',
      fecha: fechaSeleccionada,
      fechaLegible: fechaObj.etiqueta,
      hora: horaSeleccionada,
    };

    if (onContinuarDirecto) {
      onContinuarDirecto(seleccion);
    } else {
      setSelectedServiceForBooking({ ...currentService, seleccion });
      navigate('reserva');
    }
  };

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1120px] mx-auto px-5 md:px-8 py-8 md:py-10 animate-fade-in">
        <button
          type="button"
          onClick={() => navigate('negocio')}
          className="flex items-center gap-1.5 text-[#66716c] hover:text-[#18211e] text-[13px] font-medium transition-colors cursor-pointer bg-transparent border-none mb-5"
        >
          ← Volver al detalle del negocio
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
              Agendamiento (HU 3.1.3)
            </p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px] tracking-[-0.56px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
              Fechas y horarios disponibles
            </h1>
            <p className="text-[#66716c] text-[14px] mt-1">
              Selecciona el día y la hora que mejor se adapten a tu agenda. Solo se muestran turnos 100% libres.
            </p>
          </div>

          {/* Selector de Periodo */}
          <div className="inline-flex bg-[#e5e7e3] rounded-[8px] p-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setPeriodo('octubre')}
              className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer border-none ${
                periodo === 'octubre' ? 'bg-[#fcfcf8] text-[#005146] shadow-xs' : 'text-[#66716c] hover:text-[#18211e]'
              }`}
            >
              Octubre 2026
            </button>
            <button
              type="button"
              onClick={() => setPeriodo('noviembre')}
              className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer border-none ${
                periodo === 'noviembre' ? 'bg-[#fcfcf8] text-[#005146] shadow-xs' : 'text-[#66716c] hover:text-[#18211e]'
              }`}
            >
              Noviembre 2026
            </button>
          </div>
        </div>

        {/* ALERTA SI SE DETECTÓ CONFLICTO DE HORARIO (HU 3.2.1) */}
        {horarioNoDisponible && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-5 py-4 rounded-[12px] text-[13px] mb-6 flex items-start gap-3 shadow-xs animate-shake">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-red-600 mt-0.5">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              <strong className="block font-semibold">El horario seleccionado ya no está disponible</strong>
              <span>
                Otro cliente o bloqueo del proveedor acaba de reservar el turno de las {horarioNoDisponible.hora} del {horarioNoDisponible.fecha}. Por favor elige otro horario de la lista a continuación.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Columna Izquierda: Selector de Fechas y Horas */}
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 shadow-xs">
            {periodo === 'noviembre' ? (
              /* HU 3.1.3: Estado sin disponibilidad próxima */
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#e5e8e1] flex items-center justify-center text-[#66716c] mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M8 2v4M16 2v4M3 10h18M9 14l6 6M15 14l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-[#18211e] text-[20px] font-bold" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                  No hay disponibilidad próxima
                </h3>
                <p className="text-[#66716c] text-[13px] leading-[21px] max-w-[420px] mt-2">
                  {selectedBusiness?.name || 'Centro Vital'} todavía no ha habilitado turnos en su agenda para el mes de noviembre. Consulta los cupos disponibles de octubre.
                </p>
                <button
                  type="button"
                  onClick={() => setPeriodo('octubre')}
                  className="mt-5 border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] text-[13px] font-semibold px-5 py-2.5 rounded-[8px] transition-colors cursor-pointer"
                >
                  Ver disponibilidad de octubre 2026
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-[#18211e] text-[17px] font-bold mb-3" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                  1. Selecciona la fecha
                </h2>

                {/* Carrusel de días */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-6">
                  {FECHAS_OCTUBRE.map((f) => {
                    const isSelected = f.fecha === fechaSeleccionada;
                    return (
                      <button
                        key={f.fecha}
                        type="button"
                        onClick={() => {
                          setFechaSeleccionada(f.fecha);
                          setHoraSeleccionada('');
                        }}
                        className={`p-3.5 rounded-[10px] border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#005146] text-white border-[#005146] shadow-sm'
                            : 'bg-[#fcfcf8] border-[#d4d9d3] hover:border-[#005146] text-[#18211e]'
                        }`}
                      >
                        <span className={`block text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-[#66716c]'}`}>
                          {f.semana}
                        </span>
                        <span className="block text-[20px] font-bold mt-0.5" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                          {f.dia}
                        </span>
                        <span className={`block text-[10px] mt-1 ${isSelected ? 'text-white/90' : 'text-[#78938e]'}`}>
                          Octubre
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#e2e5df] pt-6">
                  <h2 className="text-[#18211e] text-[17px] font-bold mb-1" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                    2. Selecciona la hora
                  </h2>
                  <p className="text-[#66716c] text-[13px] mb-4">
                    Horarios calculados según la duración de {currentService.nombre} ({currentService.duracion || `${currentService.duracionMin} min`}).
                  </p>

                  {horariosDisponibles.length === 0 ? (
                    <div className="bg-[#f8f8f4] border border-[#d4d9d3] p-5 rounded-[10px] text-center text-[#66716c] text-[13px]">
                      No hay horarios disponibles en esta fecha. Por favor elige otro día.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {horariosDisponibles.map((h) => {
                        const isSelected = h === horaSeleccionada;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHoraSeleccionada(h)}
                            className={`py-2.5 px-3 rounded-[8px] border text-[14px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#005146] text-white border-[#005146] shadow-xs'
                                : 'bg-[#fcfcf8] border-[#d4d9d3] text-[#18211e] hover:border-[#005146] hover:bg-[#e6f0ef]'
                            }`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Resumen previo */}
          <aside className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 h-fit shadow-xs">
            <h2 className="text-[#18211e] text-[16px] font-bold pb-3 border-b border-[#e2e5df]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
              Resumen de selección
            </h2>

            <div className="flex flex-col gap-3.5 py-5 text-[13px]">
              <div className="flex justify-between gap-4">
                <span className="text-[#66716c]">Servicio</span>
                <span className="font-semibold text-[#18211e] text-right">{currentService.nombre}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#66716c]">Proveedor</span>
                <span className="font-medium text-[#18211e] text-right">{selectedBusiness?.name || 'Centro Vital'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#66716c]">Duración</span>
                <span className="font-medium text-[#18211e]">{currentService.duracion || `${currentService.duracionMin} min`}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#66716c]">Fecha</span>
                <span className="font-semibold text-[#18211e] text-right">{fechaObj?.etiqueta || 'Por seleccionar'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#66716c]">Hora</span>
                <span className="font-semibold text-[#18211e]">{horaSeleccionada || 'Por seleccionar'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#e2e5df]">
              <span className="text-[#18211e] text-[14px] font-medium">Total a pagar</span>
              <span className="text-[#005146] text-[18px] font-bold">
                ${(currentService.precio || 45000).toLocaleString('es-CO')}
              </span>
            </div>

            <button
              type="button"
              disabled={!horaSeleccionada}
              onClick={handleContinuar}
              className="w-full bg-[#005146] hover:bg-[#00403b] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-[8px] py-3 mt-6 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Continuar a revisión →
            </button>
            <p className="text-[11px] text-[#66716c] text-center mt-2.5">
              El cupo se reservará temporalmente en el siguiente paso.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
