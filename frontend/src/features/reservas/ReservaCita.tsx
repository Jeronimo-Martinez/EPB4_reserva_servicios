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
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Temporizador de Hold preventivo (10 minutos exactos = 600 segundos)
  const [segundosRestantes, setSegundosRestantes] = useState(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutos = Math.floor(segundosRestantes / 60);
  const segundos = segundosRestantes % 60;
  const tiempoFormateado = `${minutos < 10 ? '0' : ''}${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
  const isExpired = segundosRestantes === 0;

  function handleRevisar(nuevaSeleccion: SeleccionCita) {
    setSeleccion(nuevaSeleccion);
    setPaso('revision');
  }

  function handleConfirmar() {
    // Si no hay sesión iniciada, solicitar autenticación obligatoria
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isExpired) {
      return;
    }

    // Si hay conflicto simulado o horario deja de estar disponible
    if (simularConflicto && !conflictoDisparado) {
      setConflicto({ fecha: seleccion.fecha, hora: seleccion.hora });
      setConflictoDisparado(true);
      setPaso('seleccion');
      return;
    }

    // La reserva se crea explícitamente desde el resumen con datos del usuario en sesión
    const newRes = createReservation({
      serviceId: seleccion.servicioId,
      serviceName: seleccion.servicioNombre,
      businessId: selectedBusiness?.id || 'centro-vital',
      businessName: seleccion.negocioNombre,
      businessLocation: seleccion.negocioUbicacion,
      clientName: `${user.firstName} ${user.lastName || ''}`.trim(),
      clientEmail: user.email,
      clientPhone: user.phone || '+57 300 123 4567',
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

  // ─── PASO 2: REVISIÓN Y CONFIRMACIÓN PREVIA ───
  if (paso === 'revision') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />

        <main className="flex-1 w-full max-w-[820px] mx-auto px-5 md:px-8 py-10 animate-fade-in">
          <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
            Paso final de confirmación
          </p>
          <h1 className="text-[#18211e] text-[28px] font-bold leading-[36px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
            Revisa y confirma tu cita
          </h1>
          <p className="text-[#66716c] text-[14px] mt-1">
            Verifica que todos los datos de la cita sean correctos. La reserva no se creará hasta que confirmes explícitamente.
          </p>

          {/* Banner de Hold Preventivo de 10 minutos */}
          {!isExpired ? (
            <div className="flex items-start gap-3.5 bg-[#e6f0ef] border border-[#b8d4d1] rounded-[12px] px-5 py-4 mt-6 shadow-xs" role="status">
              <div className="w-8 h-8 rounded-full bg-[#005146] text-white flex items-center justify-center shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[#18211e] text-[14px] font-bold">
                  Horario reservado temporalmente por {tiempoFormateado} minutos
                </p>
                <p className="text-[#66716c] text-[12px] leading-[18px] mt-0.5">
                  Bloqueamos temporalmente este cupo para evitar que otro cliente lo tome al mismo tiempo mientras revisas tu información.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3.5 bg-[#fdf1f0] border border-[#f2bfbb] text-[#d94f41] rounded-[12px] px-5 py-4 mt-6 shadow-xs" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="flex-1">
                <p className="text-[14px] font-bold">El tiempo de retención temporal ha expirado</p>
                <p className="text-[12px] leading-[18px] mt-0.5">
                  El cupo preventivo de 10 minutos se ha liberado. Por favor regresa y selecciona tu horario nuevamente para asegurar tu turno.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaso('seleccion')}
                className="bg-[#d94f41] text-white text-[12px] font-semibold px-3 py-1.5 rounded-[6px] hover:bg-[#b83b2f] transition-colors cursor-pointer shrink-0"
              >
                Actualizar horario
              </button>
            </div>
          )}

          {/* Tarjeta de Resumen Detallado */}
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

              {user && (
                <div className="py-3.5 flex justify-between gap-4 bg-[#f8f8f4] -mx-6 md:-mx-8 px-6 md:px-8">
                  <span className="text-[#66716c]">Cliente:</span>
                  <span className="font-semibold text-[#18211e] text-right">
                    {user.firstName} {user.lastName || ''} ({user.email})
                  </span>
                </div>
              )}

              <div className="py-4 flex justify-between items-center text-[16px] bg-[#f8f8f4] -mx-6 md:-mx-8 px-6 md:px-8 border-t border-[#e2e5df]">
                <span className="font-bold text-[#18211e]">Total a pagar:</span>
                <span className="text-[#005146] text-[20px] font-bold">
                  ${seleccion.precio.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </section>

          {/* Aviso si no hay sesión iniciada */}
          {!user && (
            <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 mt-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[#18211e] text-[15px] font-bold">Inicia sesión para confirmar tu reserva</h3>
                  <p className="text-[#66716c] text-[13px] mt-0.5">
                    Necesitas una cuenta de cliente para asociar tu cita. Tu turno permanecerá guardado.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="bg-[#005146] hover:bg-[#00403b] text-white text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors cursor-pointer shadow-xs"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => navigate('registro-cliente')}
                  className="border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] text-[13px] font-semibold px-4 py-2.5 rounded-[8px] transition-colors cursor-pointer bg-white"
                >
                  Registrarse
                </button>
              </div>
            </div>
          )}

          {/* Botones de acción */}
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
              disabled={isExpired}
              className={`text-[14px] font-semibold px-8 py-3 rounded-[8px] transition-all cursor-pointer shadow-md active:scale-95 ${
                isExpired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  : 'bg-[#005146] hover:bg-[#00403b] text-white'
              }`}
            >
              Confirmar reserva ahora
            </button>
          </div>
        </main>

        {/* Modal si intenta confirmar sin sesión */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-modal-backdrop">
            <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[16px] max-w-[480px] w-full p-6 md:p-8 shadow-2xl relative animate-modal-pop">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-[#66716c] hover:text-[#18211e] p-1 rounded-full cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>

              <div className="w-12 h-12 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <h3 className="text-[#18211e] text-[20px] font-bold">
                Inicia sesión para completar tu reserva
              </h3>
              <p className="text-[#66716c] text-[13px] leading-[20px] mt-2">
                Para garantizar la seguridad de tu reserva y poder enviarte el comprobante de cita, debes contar con una sesión de cliente activa.
              </p>

              <div className="flex flex-col gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="w-full bg-[#005146] hover:bg-[#00403b] text-white text-[14px] font-semibold py-3 rounded-[8px] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => navigate('registro-cliente')}
                  className="w-full border border-[#d4d9d3] hover:border-[#005146] text-[#18211e] text-[14px] font-semibold py-2.5 rounded-[8px] transition-colors cursor-pointer bg-white"
                >
                  Crear cuenta nueva como cliente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── PASO 3: CONFIRMACIÓN Y COMPROBANTE DE RESERVA ───
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
            Código: {reservaCreadaId || 'RES-1842'}
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
