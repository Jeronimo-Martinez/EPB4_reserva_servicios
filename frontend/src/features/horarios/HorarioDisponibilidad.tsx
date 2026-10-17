import { FormEvent, useState } from 'react';
import { NavBar, SideNav } from '@/components/layout';
import { InputField, SuccessBanner, Toggle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { BusinessDayHours } from '@/types/booking';

export default function HorarioDisponibilidad() {
  const { user, navigate, logout } = useAuth();
  const { hours, updateHours, blockouts, addBlockout, removeBlockout } = useBooking();

  const [dias, setDias] = useState<BusinessDayHours[]>(hours);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [guardado, setGuardado] = useState(false);

  // Tab: 'semanal' o 'bloqueos' (HU 2.2.1 vs HU 2.2.2)
  const [tab, setTab] = useState<'semanal' | 'bloqueos'>('semanal');

  // Formulario de bloqueo (HU 2.2.2)
  const [bloqueoForm, setBloqueoForm] = useState({
    fecha: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    fechaFin: '',
    tipo: 'dia_completo' as 'dia_completo' | 'hora_especifica',
    horaInicio: '14:00',
    horaFin: '16:00',
    motivo: '',
  });
  const [bloqueoAlerta, setBloqueoAlerta] = useState<string | null>(null);

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
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

  function actualizarDia(id: string, cambio: Partial<BusinessDayHours>) {
    setDias((actuales) => actuales.map((dia) => (dia.id === id ? { ...dia, ...cambio } : dia)));
    setErrores((actuales) => {
      const siguientes = { ...actuales };
      delete siguientes[id];
      return siguientes;
    });
    setErrorGeneral('');
    setGuardado(false);
  }

  function guardarHorario(event: FormEvent) {
    event.preventDefault();
    const activos = dias.filter((dia) => dia.activo);

    if (activos.length === 0) {
      setErrorGeneral('Selecciona al menos un día de atención para continuar.');
      setGuardado(false);
      return;
    }

    const nuevosErrores: Record<string, string> = {};
    activos.forEach((dia) => {
      if (!dia.inicio || !dia.cierre) {
        nuevosErrores[dia.id] = 'Completa la hora de inicio y de cierre.';
      } else if (dia.inicio >= dia.cierre) {
        nuevosErrores[dia.id] = 'La hora de inicio debe ser anterior a la hora de cierre.';
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setGuardado(false);
      return;
    }

    setErrores({});
    updateHours(dias);
    setGuardado(true);
  }

  function handleCrearBloqueo(e: FormEvent) {
    e.preventDefault();
    if (!bloqueoForm.fecha) return;

    if (bloqueoForm.tipo === 'hora_especifica' && bloqueoForm.horaInicio >= bloqueoForm.horaFin) {
      setBloqueoAlerta('La hora de inicio del bloqueo debe ser anterior a la hora de fin.');
      return;
    }

    const result = addBlockout({
      fecha: bloqueoForm.fecha,
      fechaFin: bloqueoForm.fechaFin || undefined,
      horaInicio: bloqueoForm.tipo === 'hora_especifica' ? bloqueoForm.horaInicio : undefined,
      horaFin: bloqueoForm.tipo === 'hora_especifica' ? bloqueoForm.horaFin : undefined,
      motivo: bloqueoForm.motivo || 'No disponible por bloqueo del proveedor',
    });

    if (result.conflictCount > 0) {
      setBloqueoAlerta(
        `¡Atención! Este bloqueo afecta a ${result.conflictCount} cita(s) previamente agendada(s). Se recomienda revisar tu agenda para informar a los clientes o reprogramar.`
      );
    } else {
      setBloqueoAlerta(null);
    }

    // Reset motivo
    setBloqueoForm({
      ...bloqueoForm,
      motivo: '',
    });
  }

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-5 md:px-8 py-8 md:py-10 flex gap-8">
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
          <SideNav items={sideNavItems} active="Horarios" />
        </aside>

        <div className="flex-1 min-w-0 max-w-[860px] flex flex-col gap-6">
          {guardado && (
            <SuccessBanner
              title="Horario guardado correctamente"
              description="La disponibilidad de reservas ya se calcula con estos días y horas de atención."
              onDismiss={() => setGuardado(false)}
            />
          )}

          {errorGeneral && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[8px] text-[14px]">
              {errorGeneral}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase mb-1">
                Disponibilidad del negocio
              </p>
              <h1 className="text-[#18211e] text-[26px] font-bold leading-[34px] tracking-[-0.52px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                Gestión de horarios y bloqueos
              </h1>
              <p className="text-[#66716c] text-[14px] leading-[20px] mt-1">
                Configura los días en que prestas servicio y bloquea fechas u horarios específicos para evitar reservas no deseadas.
              </p>
            </div>

            {/* Selector de pestañas: Semanal vs Bloqueos */}
            <div className="inline-flex self-start sm:self-auto bg-[#e5e7e3] rounded-[8px] p-1" role="tablist">
              <button
                type="button"
                onClick={() => setTab('semanal')}
                className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer border-none ${
                  tab === 'semanal' ? 'bg-[#fcfcf8] text-[#005146] shadow-xs' : 'text-[#66716c] hover:text-[#18211e]'
                }`}
              >
                Horario Semanal (HU 2.2.1)
              </button>
              <button
                type="button"
                onClick={() => setTab('bloqueos')}
                className={`px-4 py-2 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer border-none ${
                  tab === 'bloqueos' ? 'bg-[#fcfcf8] text-[#005146] shadow-xs' : 'text-[#66716c] hover:text-[#18211e]'
                }`}
              >
                Bloqueos de Horario (HU 2.2.2)
              </button>
            </div>
          </div>

          {/* TAB 1: Horario semanal (HU 2.2.1) */}
          {tab === 'semanal' && (
            <form onSubmit={guardarHorario} noValidate className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] overflow-hidden shadow-xs">
              <div className="px-5 md:px-6 py-5 border-b border-[#e2e5df] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#f8f8f4]">
                <div>
                  <h2 className="text-[#18211e] text-[17px] font-bold leading-[24px]" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                    Jornada y días de atención
                  </h2>
                  <p className="text-[#66716c] text-[12px] leading-[18px] mt-0.5">
                    Activa los días laborables y define la hora de apertura y cierre. El inicio debe ser anterior al cierre.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[#66716c] text-[12px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Zona horaria: Bogotá (GMT-5)
                </div>
              </div>

              <div className="divide-y divide-[#e2e5df]">
                {dias.map((dia) => (
                  <div key={dia.id} className={`px-5 md:px-6 py-4.5 transition-colors ${dia.activo ? 'bg-[#fcfcf8]' : 'bg-[#f7f8f4]'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 sm:gap-6 items-start">
                      <div className="pt-1">
                        <Toggle
                          checked={dia.activo}
                          onChange={(activo) => actualizarDia(dia.id, { activo })}
                          label={dia.nombre}
                          description={dia.activo ? 'Disponible para citas' : 'Cerrado / No disponible'}
                        />
                      </div>

                      {dia.activo ? (
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="w-[140px]">
                              <InputField
                                label="Hora de apertura"
                                type="time"
                                value={dia.inicio}
                                onChange={(inicio) => actualizarDia(dia.id, { inicio })}
                              />
                            </div>
                            <span className="text-[#66716c] text-[14px] mt-5">hasta</span>
                            <div className="w-[140px]">
                              <InputField
                                label="Hora de cierre"
                                type="time"
                                value={dia.cierre}
                                onChange={(cierre) => actualizarDia(dia.id, { cierre })}
                              />
                            </div>
                          </div>
                          {errores[dia.id] && (
                            <p className="text-[#d94f41] text-[12px] mt-1.5 flex items-center gap-1">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                              {errores[dia.id]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-2.5 text-[#66716c] text-[13px] italic">
                          No se reciben reservas los {dia.nombre.toLowerCase()}s.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 md:px-6 py-4 bg-[#f8f8f4] border-t border-[#e2e5df] flex justify-end gap-3">
                <button
                  type="submit"
                  className="bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-6 py-2.5 rounded-[8px] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Guardar horario semanal
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Bloqueos de horarios (HU 2.2.2) */}
          {tab === 'bloqueos' && (
            <div className="flex flex-col gap-6">
              {bloqueoAlerta && (
                <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3.5 rounded-[10px] text-[13px] flex items-start gap-2.5 shadow-xs">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-amber-600 mt-0.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <strong className="block font-semibold">Aviso de impacto en reservas</strong>
                    <span>{bloqueoAlerta}</span>
                  </div>
                </div>
              )}

              {/* Formulario para añadir nuevo bloqueo */}
              <form onSubmit={handleCrearBloqueo} className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 shadow-xs">
                <h2 className="text-[#18211e] text-[18px] font-bold mb-1" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                  Bloquear fecha o rango de horario
                </h2>
                <p className="text-[#66716c] text-[13px] mb-5">
                  Evita que los clientes reserven en fechas de descanso, vacaciones o franjas específicas (como almuerzos o capacitaciones).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#18211e] mb-1">
                      Fecha a bloquear *
                    </label>
                    <input
                      type="date"
                      required
                      value={bloqueoForm.fecha}
                      onChange={(e) => setBloqueoForm({ ...bloqueoForm, fecha: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#d4d9d3] rounded-[8px] text-[14px] text-[#18211e] focus:border-[#005146] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#18211e] mb-1">
                      Fecha fin (opcional, para rango)
                    </label>
                    <input
                      type="date"
                      value={bloqueoForm.fechaFin}
                      onChange={(e) => setBloqueoForm({ ...bloqueoForm, fechaFin: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#d4d9d3] rounded-[8px] text-[14px] text-[#18211e] focus:border-[#005146] outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[13px] font-medium text-[#18211e] mb-2">
                    Tipo de bloqueo
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[14px] text-[#18211e] cursor-pointer">
                      <input
                        type="radio"
                        name="tipoBloqueo"
                        checked={bloqueoForm.tipo === 'dia_completo'}
                        onChange={() => setBloqueoForm({ ...bloqueoForm, tipo: 'dia_completo' })}
                        className="accent-[#005146]"
                      />
                      Día completo
                    </label>
                    <label className="flex items-center gap-2 text-[14px] text-[#18211e] cursor-pointer">
                      <input
                        type="radio"
                        name="tipoBloqueo"
                        checked={bloqueoForm.tipo === 'hora_especifica'}
                        onChange={() => setBloqueoForm({ ...bloqueoForm, tipo: 'hora_especifica' })}
                        className="accent-[#005146]"
                      />
                      Franja horaria específica
                    </label>
                  </div>
                </div>

                {bloqueoForm.tipo === 'hora_especifica' && (
                  <div className="grid grid-cols-2 gap-4 mt-4 bg-[#f8f8f4] p-4 rounded-[10px] border border-[#e2e5df]">
                    <div>
                      <label className="block text-[12px] font-medium text-[#18211e] mb-1">Hora inicio</label>
                      <input
                        type="time"
                        value={bloqueoForm.horaInicio}
                        onChange={(e) => setBloqueoForm({ ...bloqueoForm, horaInicio: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#d4d9d3] rounded-[8px] text-[13px] text-[#18211e] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#18211e] mb-1">Hora fin</label>
                      <input
                        type="time"
                        value={bloqueoForm.horaFin}
                        onChange={(e) => setBloqueoForm({ ...bloqueoForm, horaFin: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#d4d9d3] rounded-[8px] text-[13px] text-[#18211e] outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-[13px] font-medium text-[#18211e] mb-1">
                    Motivo del bloqueo (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Almuerzo, Cierre de festivo, Mantenimiento..."
                    value={bloqueoForm.motivo}
                    onChange={(e) => setBloqueoForm({ ...bloqueoForm, motivo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#d4d9d3] rounded-[8px] text-[14px] text-[#18211e] focus:border-[#005146] outline-none"
                  />
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[8px] transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Crear bloqueo
                  </button>
                </div>
              </form>

              {/* Lista de bloqueos actuales */}
              <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-6 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e5df] mb-4">
                  <h3 className="text-[#18211e] text-[16px] font-bold" style={{ fontFamily: '"DM Sans:Bold", sans-serif' }}>
                    Bloqueos activos ({blockouts.length})
                  </h3>
                  <span className="text-[#66716c] text-[12px]">Estos periodos no aparecen disponibles para clientes</span>
                </div>

                {blockouts.length === 0 ? (
                  <p className="text-center py-8 text-[#66716c] text-[13px]">
                    No tienes bloqueos de fechas u horarios activos.
                  </p>
                ) : (
                  <div className="divide-y divide-[#e2e5df]">
                    {blockouts.map((blk) => (
                      <div key={blk.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e5e7e3] text-[#66716c] flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[#18211e] text-[14px] font-semibold">
                              {blk.fecha} {blk.fechaFin ? `al ${blk.fechaFin}` : ''}
                              {blk.horaInicio ? ` (${blk.horaInicio} – ${blk.horaFin})` : ' · Todo el día'}
                            </p>
                            <p className="text-[#66716c] text-[12px] mt-0.5">{blk.motivo}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeBlockout(blk.id)}
                          className="px-3 py-1.5 border border-[#d4d9d3] hover:border-red-400 text-red-600 hover:bg-red-50 text-[12px] font-semibold rounded-[6px] transition-colors cursor-pointer"
                        >
                          Eliminar bloqueo
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
