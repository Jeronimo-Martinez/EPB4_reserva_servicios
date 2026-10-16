import { useState, useEffect } from 'react';
import { NavBar } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import DisponibilidadServicio, { SeleccionCita } from '@/features/disponibilidad/DisponibilidadServicio';

type Paso = 'seleccion' | 'revision' | 'exito';

export default function ReservaCita({
  iniciarEnResumen = false,
  simularConflicto = false,
}: {
  iniciarEnResumen?: boolean;
  simularConflicto?: boolean;
}) {
  const { user, navigate } = useAuth();
  const { selectedBusiness, selectedServiceForBooking, createReservation } = useBooking();

  const [paso, setPaso] = useState<Paso>(iniciarEnResumen ? 'revision' : 'revision');

  const seleccionInicial: SeleccionCita = selectedServiceForBooking?.seleccion || {
    servicioId: selectedServiceForBooking?.id || 'corte',
    servicioNombre: selectedServiceForBooking?.nombre || 'Corte y estilizado',
    duracionMin: selectedServiceForBooking?.duracionMin || 45,
    precio: selectedServiceForBooking?.precio || 45000,
    negocioNombre: selectedBusiness?.name || 'Centro Vital',
    negocioUbicacion: selectedBusiness?.location || 'Calle 93 #14-28, Zona Norte, Bogotá',
    fecha: '2026-10-24',
    fechaLegible: 'Sábado, 24 de octubre de 2026',
    hora: '10:00',
  };

  const [seleccion, setSeleccion] = useState<SeleccionCita>(seleccionInicial);
  const [conflicto, setConflicto] = useState<{ fecha: string; hora: string } | null>(null);
  const [conflictoDisparado, setConflictoDisparado] = useState(false);
  const [reservaCreadaId, setReservaCreadaId] = useState<string>('');

  // Temporizador de Hold preventivo (HU 3.2.1: 10 minutos)
  const [minutosRestantes, setMinutosRestantes] = useState(10);
  const [segundosRestantes, setSegundosRestantes] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s > 0) return s - 1;
        setMinutosRestantes((m) => (m > 0 ? m - 1 : 0));
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleRevisar(nuevaSeleccion: SeleccionCita) {
    setSeleccion(nuevaSeleccion);
    setPaso('revision');
  }

  function handleConfirmar() {
    // HU 3.2.1: Si hay conflicto simulado o horario deja de estar disponible
    if (simularConflicto && !conflictoDisparado) {
      setConflicto({ fecha: seleccion.fecha, hora: seleccion.hora });
      setConflictoDisparado(true);
      setPaso('seleccion');
      return;
    }

    // HU 3.2.2 & HU 3.2.3: La reserva se crea explícitamente desde el resumen
    const newRes = createReservation({
      serviceId: seleccion.servicioId,
      serviceName: seleccion.servicioNombre,
      businessId: selectedBusiness?.id || 'centro-vital',
      businessName: seleccion.negocioNombre,
      businessLocation: seleccion.negocioUbicacion,
      clientName: user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Laura Gómez',
      clientEmail: user?.email || 'laura.gomez@email.com',
      clientPhone: user?.phone || '+57 310 458 6721',
      date: seleccion.fecha,
      timeSlot: seleccion.hora,
      durationMinutes: seleccion.duracionMin,
      price: seleccion.precio,
    });

    setReservaCreadaId(newRes.id);
    setPaso('exito');
  }

  // ─── PASO 1: SELECCIÓN DE DISPONIBILIDAD (SI SE CAMBIA HORARIO) ───
  if (paso === 'seleccion') {
    return <DisponibilidadServicio onContinuarDirecto={handleRevisar} horarioNoDisponible={conflicto} />;
  }

  // ─── PASO 2: REVISIÓN Y CONFIRMACIÓN PREVIA (HU 3.2.2) ───
  if (paso === 'revision') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />

        <main className="flex-1 w-full max-w-[820px] mx-auto px-5 md:px-8 py-10 animate-fade-in">
          <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
            Paso final de confirmación (HU 3.2.2)
          </p>
          <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
            Revisa y confirma tu cita
          </h1>
          <p className="text-[#66716c] text-[14px] mt-1">
            Verifica que todos los datos de la cita sean correctos. La reserva no se creará hasta que confirmes explícitamente.
          </p>

          {/* Banner de Hold Preventivo (HU 3.2.1) */}
          <div className="flex items-start gap-3.5 bg-[#e6f0ef] border border-[#b8d4d1] rounded-[12px] px-5 py-4 mt-6 shadow-xs" role="status">
            <div className="w-8 h-8 rounded-full bg-[#005146] text-white flex items-center justify-center shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[#18211e] text-[14px] font-bold">
                Horario reservado temporalmente por {minutosRestantes}:{segundosRestantes < 10 ? `0${segundosRestantes}` : segundosRestantes} minutos
              </p>
              <p className="text-[#66716c] text-[12px] leading-[18px] mt-0.5">
                Bloqueamos temporalmente este cupo para evitar que otro cliente lo tome al mismo tiempo mientras revisas tu información.
              </p>
            </div>
          </div>

          {/* Tarjeta de Resumen Detallado (HU 3.2.2) */}
          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 md:p-8 mt-6 shadow-xs">
            <h2 className="text-[#18211e] text-[18px] font-bold pb-4 border-b border-[#e2e5df]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
              Resumen de la cita
            </h2>

            <div className="divide-y divide-[#e2e5df] text-[14px]">
              <div className="py-3.5 flex justify-between gap-4">
                <span className="text-[#66716c]">Negocio:</span>
                <span className="font-semibold text-[#18211e] text-right">{seleccion.negocioNombre}</span>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <span className="text-[#66716c]">Ubicación:</span>
                <span className="font-medium text-[#18211e] text-right">{seleccion.negocioUbicacion}</span>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <span className="text-[#66716c]">Servicio solicitado:</span>
                <span className="font-bold text-[#18211e]">{seleccion.servicioNombre}</span>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <span className="text-[#66716c]">Duración estimada:</span>
                <span className="font-medium text-[#18211e]">{seleccion.duracionMin} minutos</span>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <span className="text-[#66716c]">Fecha programada:</span>
                <span className="font-semibold text-[#18211e]">{seleccion.fechaLegible}</span>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <span className="text-[#66716c]">Hora seleccionada:</span>
                <span className="font-bold text-[#005146]">{seleccion.hora} · Bogotá (GMT-5)</span>
              </div>
              <div className="py-4 flex justify-between items-center text-[16px] bg-[#f8f8f4] -mx-6 md:-mx-8 px-6 md:px-8 border-t border-[#e2e5df]">
                <span className="font-bold text-[#18211e]">Total a pagar:</span>
                <span className="text-[#005146] text-[20px] font-bold">
                  ${seleccion.precio.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </section>

          {/* Botones de acción: Cambiar horario vs Confirmar (HU 3.2.2) */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3.5 mt-6">
            <button
              type="button"
              onClick={() => setPaso('seleccion')}
              className="border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] text-[14px] font-semibold px-6 py-3 rounded-[8px] transition-colors cursor-pointer bg-white"
            >
              ← Modificar fecha u horario
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              className="bg-[#005146] hover:bg-[#00403b] text-white text-[14px] font-semibold px-8 py-3 rounded-[8px] transition-all cursor-pointer shadow-md active:scale-95"
            >
              Confirmar reserva ahora
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── PASO 3: CONFIRMACIÓN Y COMPROBANTE DE RESERVA (HU 3.2.3) ───
  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 flex items-center justify-center px-5 py-12 animate-fade-in">
        <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[16px] p-8 md:p-10 text-center w-full max-w-[540px] shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#005146] text-white flex items-center justify-center mx-auto shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <span className="inline-block bg-[#e6f0ef] text-[#005146] text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mt-5">
            Código: {reservaCreadaId || 'R-1842'}
          </span>

          <h1 className="text-[#18211e] text-[26px] font-bold mt-2" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
            ¡Reserva confirmada con éxito!
          </h1>
          <p className="text-[#66716c] text-[14px] leading-[21px] mt-2">
            Tu cita en <strong>{seleccion.negocioNombre}</strong> quedó agendada para el <strong>{seleccion.fechaLegible.toLowerCase()} a las {seleccion.hora}</strong>.
          </p>

          <div className="bg-[#f2f3ee] border border-[#e2e5df] rounded-[10px] p-4 mt-6 text-left text-[13px] flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-[#66716c]">Servicio:</span>
              <strong className="text-[#18211e]">{seleccion.servicioNombre}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66716c]">Duración:</span>
              <span className="text-[#18211e]">{seleccion.duracionMin} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66716c]">Ubicación:</span>
              <span className="text-[#18211e]">{seleccion.negocioUbicacion}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#d4d9d3]">
              <span className="text-[#66716c]">Valor total:</span>
              <strong className="text-[#005146] text-[15px]">${seleccion.precio.toLocaleString('es-CO')}</strong>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-7">
            <button
              type="button"
              onClick={() => navigate('reservas')}
              className="w-full bg-[#005146] hover:bg-[#00403b] text-white text-[14px] font-semibold py-3 rounded-[8px] transition-all cursor-pointer shadow-xs active:scale-95"
            >
              Ver mis reservas
            </button>
            <button
              type="button"
              onClick={() => navigate('catalogo')}
              className="w-full border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] text-[13px] font-semibold py-2.5 rounded-[8px] transition-colors cursor-pointer bg-white"
            >
              Explorar más servicios
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
