import { useState } from 'react';
import { NavBar, SideNav } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { AppReservation } from '@/types/booking';

type Vista = 'dia' | 'semana' | 'mes';

const HORAS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const DIAS_SEMANA = [
  { nombre: 'Lun', fecha: '2026-10-19', numero: 19 },
  { nombre: 'Mar', fecha: '2026-10-20', numero: 20 },
  { nombre: 'Mié', fecha: '2026-10-21', numero: 21 },
  { nombre: 'Jue', fecha: '2026-10-22', numero: 22 },
  { nombre: 'Vie', fecha: '2026-10-23', numero: 23 },
  { nombre: 'Sáb', fecha: '2026-10-24', numero: 24 },
];

export default function AgendaProveedor() {
  const { user, navigate, logout } = useAuth();
  const { reservations, blockouts, cancelReservationByProvider, updateReservationStatus } = useBooking();

  const [vista, setVista] = useState<Vista>('semana');
  const [seleccionada, setSeleccionada] = useState<AppReservation | null>(null);

  // Estados de modal de cancelación (HU 3.3.3)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Estados de cambio de asistencia (HU 4.2.1)
  const [nuevoEstado, setNuevoEstado] = useState<'ATENDIDA' | 'NO_ASISTIDA'>('ATENDIDA');

  const businessName = user?.businessName || 'Centro Vital';
  const businessCategory = user?.businessCategory || 'Belleza y Bienestar';

  const sideNavItems = [
    {
      label: 'Mis Servicios',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => navigate('servicios'),
    },
    {
      label: 'Agenda',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => navigate('agenda'),
    },
    {
      label: 'Horarios',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => navigate('horarios'),
    },
    {
      label: 'Perfil de Negocio',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
      onClick: () => navigate('perfil'),
    },
    {
      label: 'Cerrar Sesión',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => logout(),
    },
  ];

  const handleConfirmCancelation = () => {
    if (!seleccionada) return;
    cancelReservationByProvider(seleccionada.id, motivoCancelacion);
    setShowCancelModal(false);
    setMotivoCancelacion('');
    setSeleccionada(null);
  };

  const handleStatusChange = () => {
    if (!seleccionada) return;
    updateReservationStatus(seleccionada.id, nuevoEstado);
    setSeleccionada({ ...seleccionada, status: nuevoEstado });
  };

  // Helper para verificar si un slot está bloqueado
  const isSlotBlocked = (fecha: string, hora: string) => {
    return blockouts.find((b) => {
      if (b.fecha !== fecha) return false;
      if (!b.horaInicio) return true; // Todo el día bloqueado
      return hora >= b.horaInicio && (!b.horaFin || hora < b.horaFin);
    });
  };

  // Helper para encontrar reserva en un slot
  const getReservationForSlot = (fecha: string, hora: string) => {
    return reservations.find(
      (r) => r.date === fecha && r.timeSlot.startsWith(hora.substring(0, 2)) && r.status !== 'CANCELADA'
    );
  };

  // Calendario mensual
  const diasMes = Array.from({ length: 31 }, (_, i) => {
    const diaNum = i + 1;
    const fechaStr = `2026-10-${diaNum < 10 ? `0${diaNum}` : diaNum}`;
    const resDia = reservations.find((r) => r.date === fechaStr && r.status !== 'CANCELADA');
    const bloqDia = blockouts.find((b) => b.fecha === fechaStr);
    return {
      numero: diaNum,
      fecha: fechaStr,
      reserva: resDia,
      bloqueado: !!bloqDia,
      hoy: diaNum === 16,
    };
  });

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1340px] mx-auto px-5 md:px-8 py-8 md:py-10 flex gap-8">
        <aside className="shrink-0 hidden lg:block w-[240px]">
          <div className="mb-6">
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
              Panel Profesional
            </p>
            <p className="text-[#18211e] text-[17px] font-bold leading-snug">
              {businessName}
            </p>
            {businessCategory && (
              <span className="inline-block mt-1 text-[12px] text-[#005146] bg-[#e6f0ef] px-2.5 py-0.5 rounded-full font-medium">
                {businessCategory}
              </span>
            )}
          </div>
          <SideNav items={sideNavItems} active="Agenda" />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
                Panel del proveedor
              </p>
              <h1 className="text-[#18211e] text-[26px] font-bold leading-[34px] tracking-[-0.52px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                Mi agenda de citas
              </h1>
              <p className="text-[#66716c] text-[14px] leading-[20px] mt-1">
                Consulta tus citas agendadas, franjas disponibles y horarios bloqueados en vistas diaria, semanal y mensual.
              </p>
            </div>

            {/* Switch de Vistas: Día / Semana / Mes */}
            <div className="inline-flex self-start md:self-auto bg-[#e5e7e3] rounded-[8px] p-1" role="group">
              {(['dia', 'semana', 'mes'] as Vista[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVista(v)}
                  className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer border-none capitalize ${
                    vista === v ? 'bg-[#fcfcf8] text-[#005146] shadow-xs' : 'text-[#66716c] hover:text-[#18211e]'
                  }`}
                >
                  {v === 'dia' ? 'Día' : v === 'semana' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>

          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] overflow-hidden shadow-xs">
            {/* Header del Calendario */}
            <div className="px-5 py-4 border-b border-[#d4d9d3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8f8f4]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Anterior"
                  className="w-8 h-8 rounded-[7px] border border-[#d4d9d3] bg-white flex items-center justify-center text-[#66716c] hover:border-[#005146] hover:text-[#005146] transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="h-8 px-3 rounded-[7px] border border-[#d4d9d3] bg-white text-[#18211e] text-[11px] font-semibold flex items-center">
                  Octubre 2026
                </span>
                <button
                  type="button"
                  aria-label="Siguiente"
                  className="w-8 h-8 rounded-[7px] border border-[#d4d9d3] bg-white flex items-center justify-center text-[#66716c] hover:border-[#005146] hover:text-[#005146] transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h2 className="text-[#18211e] text-[15px] font-bold ml-2" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                  {vista === 'dia' ? 'Miércoles, 21 de octubre' : vista === 'semana' ? '19 – 24 de octubre de 2026' : 'Octubre 2026'}
                </h2>
              </div>

              {/* Leyenda de colores */}
              <div className="flex items-center gap-4 text-[#66716c] text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#e6f0ef] border-l-2 border-[#005146]" />
                  Reserva programada
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs border border-[#c8dad6] bg-[#fcfcf8]" />
                  Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#e5e7e3] border border-[#d4d9d3]" />
                  Bloqueado
                </span>
              </div>
            </div>

            {/* VISTA SEMANAL */}
            {vista === 'semana' && (
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  {/* Encabezado de Días */}
                  <div className="grid grid-cols-[64px_repeat(6,minmax(110px,1fr))] border-b border-[#d4d9d3]">
                    <div className="bg-[#f8f8f4]" />
                    {DIAS_SEMANA.map((dia) => (
                      <div
                        key={dia.fecha}
                        className={`py-3 text-center border-l border-[#e2e5df] ${
                          dia.numero === 21 ? 'bg-[#edf4f2]' : 'bg-[#f8f8f4]'
                        }`}
                      >
                        <p className="text-[#66716c] text-[10px] font-semibold uppercase tracking-[0.6px]">
                          {dia.nombre}
                        </p>
                        <p
                          className={`text-[16px] font-bold mt-0.5 ${
                            dia.numero === 21 ? 'text-[#005146]' : 'text-[#18211e]'
                          }`}
                        >
                          {dia.numero}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Franjas Horarias */}
                  {HORAS.map((hora) => (
                    <div
                      key={hora}
                      className="grid grid-cols-[64px_repeat(6,minmax(110px,1fr))] min-h-[66px] border-b border-[#e2e5df] last:border-b-0"
                    >
                      <div className="bg-[#f8f8f4] text-[#66716c] text-[11px] text-right pr-3 pt-2 font-medium">
                        {hora}
                      </div>

                      {DIAS_SEMANA.map((dia) => {
                        const res = getReservationForSlot(dia.fecha, hora);
                        const bloq = isSlotBlocked(dia.fecha, hora);

                        return (
                          <div
                            key={`${dia.fecha}-${hora}`}
                            className={`border-l border-[#e2e5df] p-1.5 ${
                              dia.numero === 21 ? 'bg-[#fbfcf9]' : 'bg-[#fcfcf8]'
                            }`}
                          >
                            {res ? (
                              <button
                                type="button"
                                onClick={() => setSeleccionada(res)}
                                className="w-full h-full min-h-[50px] bg-[#e6f0ef] border-l-[3px] border-[#005146] rounded-[5px] px-2 py-1.5 text-left hover:bg-[#d9e9e7] transition-all cursor-pointer shadow-2xs"
                              >
                                <span className="block text-[#005146] text-[10px] font-semibold">
                                  {res.timeSlot} · {res.status}
                                </span>
                                <span className="block text-[#18211e] text-[11px] font-semibold truncate">
                                  {res.clientName}
                                </span>
                                <span className="block text-[#66716c] text-[10px] truncate">
                                  {res.serviceName}
                                </span>
                              </button>
                            ) : bloq ? (
                              <div className="h-full min-h-[50px] rounded-[5px] bg-[#e5e7e3] border border-[#d4d9d3] px-2 py-1.5 flex items-start gap-1">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-[#66716c]">
                                  <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                                  <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <span className="text-[#66716c] text-[10px] font-medium leading-[13px] truncate">
                                  {bloq.motivo || 'Bloqueado'}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full min-h-[50px] rounded-[5px] border border-dashed border-[#d9e6e2] hover:bg-[#f1f6f4] transition-colors flex items-center justify-center">
                                <span className="text-[#78938e] text-[10px]">Disponible</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA DIARIA */}
            {vista === 'dia' && (
              <div className="divide-y divide-[#e2e5df]">
                {HORAS.map((hora) => {
                  const res = getReservationForSlot('2026-10-21', hora);
                  const bloq = isSlotBlocked('2026-10-21', hora);

                  return (
                    <div key={hora} className="grid grid-cols-[72px_1fr] min-h-[70px]">
                      <div className="bg-[#f8f8f4] text-[#66716c] text-[11px] text-right pr-4 pt-3 font-medium">
                        {hora}
                      </div>
                      <div className="border-l border-[#e2e5df] bg-[#fcfcf8] p-2">
                        {res ? (
                          <button
                            type="button"
                            onClick={() => setSeleccionada(res)}
                            className="w-full h-full bg-[#e6f0ef] border-l-4 border-[#005146] rounded-[6px] px-4 py-2 text-left hover:bg-[#d9e9e7] transition-all cursor-pointer"
                          >
                            <span className="text-[#005146] text-[11px] font-semibold">
                              {res.timeSlot} · {res.durationMinutes} min · Estado: {res.status}
                            </span>
                            <span className="block text-[#18211e] text-[14px] font-bold mt-0.5">
                              {res.clientName} — {res.serviceName}
                            </span>
                            <span className="text-[#66716c] text-[12px]">
                              Tel: {res.clientPhone} · {res.clientEmail}
                            </span>
                          </button>
                        ) : bloq ? (
                          <div className="h-full bg-[#e5e7e3] border border-[#d4d9d3] rounded-[6px] px-4 py-2 flex items-center gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <rect x="5" y="10" width="14" height="10" rx="2" stroke="#66716c" strokeWidth="2" />
                              <path d="M8 10V7a4 4 0 018 0v3" stroke="#66716c" strokeWidth="2" />
                            </svg>
                            <span className="text-[#66716c] text-[12px] font-medium">
                              Horario bloqueado: {bloq.motivo}
                            </span>
                          </div>
                        ) : (
                          <div className="h-full border border-dashed border-[#c8dad6] rounded-[6px] px-4 py-2 flex items-center">
                            <span className="text-[#78938e] text-[12px]">Disponible para reservas de clientes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA MENSUAL */}
            {vista === 'mes' && (
              <div className="min-w-[680px]">
                <div className="grid grid-cols-7 bg-[#f8f8f4] border-b border-[#d4d9d3]">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                    <div key={dia} className="py-3 text-center text-[#66716c] text-[10px] font-semibold uppercase tracking-[0.6px]">
                      {dia}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {diasMes.map((dia, idx) => (
                    <div
                      key={dia.fecha}
                      className={`min-h-[105px] border-r border-b border-[#e2e5df] p-2 ${
                        idx % 7 === 6 ? 'border-r-0' : ''
                      } bg-[#fcfcf8]`}
                    >
                      <span
                        className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] ${
                          dia.hoy ? 'bg-[#005146] text-white font-semibold' : 'text-[#18211e]'
                        }`}
                      >
                        {dia.numero}
                      </span>
                      {dia.reserva && (
                        <button
                          type="button"
                          onClick={() => setSeleccionada(dia.reserva!)}
                          className="block w-full bg-[#e6f0ef] border-l-[3px] border-[#005146] rounded-[4px] px-1.5 py-1 mt-1 text-left hover:bg-[#d9e9e7] transition-colors cursor-pointer"
                        >
                          <span className="block text-[#005146] text-[9px] font-semibold truncate">
                            {dia.reserva.timeSlot} {dia.reserva.clientName}
                          </span>
                        </button>
                      )}
                      {dia.bloqueado && (
                        <div className="bg-[#e5e7e3] rounded-[4px] px-1.5 py-1 mt-1 text-[#66716c] text-[9px] truncate">
                          Bloqueado
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* DRAWER / MODAL DE DETALLE DE RESERVA (HU 2.2.3, HU 3.3.3, HU 4.2.1) */}
      {seleccionada && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-[#18211e]/40 backdrop-blur-2xs cursor-default border-none"
            onClick={() => setSeleccionada(null)}
          />

          <aside className="relative w-full max-w-[460px] h-full bg-[#fcfcf8] shadow-2xl flex flex-col z-10 animate-slide-up">
            <div className="px-6 py-5 border-b border-[#d4d9d3] flex items-start justify-between bg-[#f8f8f4]">
              <div>
                <p className="text-[#005146] text-[11px] font-semibold uppercase tracking-[0.8px]">
                  Reserva {seleccionada.id}
                </p>
                <h2 className="text-[#18211e] text-[20px] font-bold mt-1" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                  Detalle de la reserva
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSeleccionada(null)}
                className="w-8 h-8 rounded-full border border-[#d4d9d3] flex items-center justify-center text-[#66716c] hover:text-[#18211e] bg-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
              {/* Cliente */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#e2e5df]">
                <div className="w-12 h-12 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center text-[15px] font-bold">
                  {seleccionada.clientName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[#18211e] text-[16px] font-bold">{seleccionada.clientName}</p>
                  <span
                    className={`inline-flex mt-1 text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${
                      seleccionada.status === 'PENDIENTE'
                        ? 'bg-amber-100 text-amber-800'
                        : seleccionada.status === 'ATENDIDA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : seleccionada.status === 'NO_ASISTIDA'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    ● Estado: {seleccionada.status}
                  </span>
                </div>
              </div>

              {/* Datos de la cita */}
              <div className="flex flex-col gap-3 py-2 border-b border-[#e2e5df] text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#66716c]">Servicio:</span>
                  <span className="font-semibold text-[#18211e]">{seleccionada.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66716c]">Fecha y hora:</span>
                  <span className="font-semibold text-[#18211e]">{seleccionada.date} a las {seleccionada.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66716c]">Duración:</span>
                  <span className="font-semibold text-[#18211e]">{seleccionada.durationMinutes} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#66716c]">Precio total:</span>
                  <span className="font-bold text-[#005146]">${seleccionada.price.toLocaleString('es-CO')}</span>
                </div>
                {seleccionada.notes && (
                  <div className="flex justify-between">
                    <span className="text-[#66716c]">Notas del cliente:</span>
                    <span className="text-[#18211e] italic">"{seleccionada.notes}"</span>
                  </div>
                )}
                {seleccionada.cancellationReason && (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded-[6px] text-red-800 text-[12px]">
                    <strong>Motivo de cancelación:</strong> {seleccionada.cancellationReason}
                  </div>
                )}
              </div>

              {/* Datos de contacto */}
              <div className="bg-[#f2f3ee] rounded-[8px] p-4 text-[13px] flex flex-col gap-2">
                <p className="font-semibold text-[#18211e] text-[12px] uppercase tracking-wider">Contacto del cliente</p>
                <p className="text-[#66716c]">📞 {seleccionada.clientPhone}</p>
                <p className="text-[#66716c]">✉️ {seleccionada.clientEmail}</p>
              </div>

              {/* HU 4.2.1: Modificar estado a Atendida o No Asistida */}
              {seleccionada.status !== 'CANCELADA' && (
                <div className="bg-[#f8f8f4] border border-[#d4d9d3] rounded-[10px] p-4">
                  <h4 className="text-[14px] font-bold text-[#18211e] mb-1">
                    Actualizar asistencia (HU 4.2.1)
                  </h4>
                  <p className="text-[12px] text-[#66716c] mb-3">
                    Marca la cita como atendida o no asistida una vez pasada la fecha de la cita para actualizar tu historial.
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value as any)}
                      className="flex-1 px-3 py-2 bg-white border border-[#d4d9d3] rounded-[6px] text-[13px] text-[#18211e] outline-none"
                    >
                      <option value="ATENDIDA">Atendida (Cliente asistió)</option>
                      <option value="NO_ASISTIDA">No asistida (Cliente ausente)</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleStatusChange}
                      className="px-4 py-2 bg-[#005146] text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#00403b] transition-colors cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* HU 3.3.3: Cancelar reserva como proveedor */}
              {seleccionada.status === 'PENDIENTE' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 border border-red-300 text-red-600 hover:bg-red-50 text-[13px] font-semibold rounded-[8px] transition-colors cursor-pointer"
                  >
                    Cancelar esta reserva como proveedor (HU 3.3.3)
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN DEL PROVEEDOR (HU 3.3.3) */}
      {showCancelModal && seleccionada && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-modal-backdrop">
          <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] max-w-[460px] w-full p-6 shadow-2xl relative animate-modal-pop">
            <h3 className="text-[19px] font-bold text-[#18211e] mb-2">
              ¿Confirmas la cancelación de esta cita?
            </h3>
            <p className="text-[13px] text-[#66716c] mb-4">
              Al cancelar, el horario ({seleccionada.date} a las {seleccionada.timeSlot}) quedará liberado automáticamente y se enviará una notificación inmediata a <strong>{seleccionada.clientName}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-[13px] font-medium text-[#18211e] mb-1">
                Motivo de la cancelación (será enviado al cliente)
              </label>
              <textarea
                rows={3}
                placeholder="Ej. Inconveniente de salud, mantenimiento imprevisto del local..."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#d4d9d3] rounded-[8px] text-[13px] text-[#18211e] outline-none resize-none focus:border-[#005146]"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-[#d4d9d3] rounded-[8px] text-[13px] font-medium text-[#18211e] hover:bg-gray-100 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelation}
                className="px-4 py-2 bg-[#d94f41] hover:bg-[#b8382c] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
