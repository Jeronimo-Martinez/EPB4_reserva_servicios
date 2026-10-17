import { useEffect, useState } from 'react';
import { NavBar, ProviderAside } from '@/components/layout';
import { FieldError, SuccessBanner, Toggle } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { DayHours, DayOfWeek, fetchBusinessHours, saveBusinessHours } from '@/api/schedule';

interface DayRow {
  enabled: boolean;
  start: string;
  end: string;
}

type Schedule = Record<DayOfWeek, DayRow>;

interface ScheduleErrors {
  form?: string;
  days: Partial<Record<DayOfWeek, string>>;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
];

// Without a saved schedule the mockup starts with Monday to Saturday enabled and empty hours.
function defaultSchedule(): Schedule {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, { enabled: key !== 'SUNDAY', start: '', end: '' }])
  ) as Schedule;
}

function fromResponse(days: DayHours[]): Schedule {
  if (days.length === 0) return defaultSchedule();
  const schedule = Object.fromEntries(
    DAYS.map(({ key }) => [key, { enabled: false, start: '', end: '' }])
  ) as Schedule;
  // The backend sends "HH:mm:ss"; <input type="time"> works with "HH:mm".
  days.forEach((d) => {
    schedule[d.dayOfWeek] = { enabled: true, start: d.startTime.slice(0, 5), end: d.endTime.slice(0, 5) };
  });
  return schedule;
}

// Same rules the backend enforces, checked here to point at the exact day before calling the API.
function validateSchedule(schedule: Schedule): ScheduleErrors {
  const enabled = DAYS.filter(({ key }) => schedule[key].enabled);
  if (enabled.length === 0) {
    return { form: 'Selecciona al menos un día de atención para continuar.', days: {} };
  }
  const days: ScheduleErrors['days'] = {};
  enabled.forEach(({ key }) => {
    const { start, end } = schedule[key];
    if (!start || !end) days[key] = 'Completa la hora de inicio y la hora de cierre.';
    else if (start >= end) days[key] = 'La hora de inicio debe ser anterior a la hora de cierre.';
  });
  const hasDayErrors = Object.keys(days).length > 0;
  return { form: hasDayErrors ? 'Revisa los días marcados: faltan horas o no son válidas.' : undefined, days };
}

export default function HorarioAtencion() {
  const { user, showNotification } = useAuth();
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);

  const providerEmail = user?.email || '';

  useEffect(() => {
    if (!providerEmail) {
      setLoading(false);
      return;
    }
    fetchBusinessHours()
      .then((res) => setSchedule(fromResponse(res.days)))
      .catch((err: unknown) => {
        showNotification('error', err instanceof ApiError ? err.message : 'No se pudo cargar el horario.');
      })
      .finally(() => setLoading(false));
    // showNotification is recreated on every render, so it stays out of the deps to load once per provider.
  }, [providerEmail]);

  // Errors appear after the first save attempt and then update while the provider fixes them.
  const errors: ScheduleErrors = attempted ? validateSchedule(schedule) : { days: {} };
  const formError = serverError || errors.form;

  function updateDay(key: DayOfWeek, patch: Partial<DayRow>) {
    setSchedule((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setServerError('');
  }

  async function handleSave() {
    setAttempted(true);
    setSaved(false);
    setServerError('');
    if (validateSchedule(schedule).form) return;

    setSaving(true);
    try {
      const days = DAYS.filter(({ key }) => schedule[key].enabled).map(({ key }) => ({
        dayOfWeek: key,
        startTime: schedule[key].start,
        endTime: schedule[key].end,
      }));
      const res = await saveBusinessHours(days);
      setSchedule(fromResponse(res.days));
      setAttempted(false);
      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setServerError(err instanceof ApiError ? err.message : 'No se pudo guardar el horario.');
    } finally {
      setSaving(false);
    }
  }

  const timeInputClass = (invalid: boolean) =>
    `w-full bg-white text-[#18211e] border rounded-[8px] px-4 py-[10px] text-[14px] outline-none transition-colors
      ${invalid ? 'border-[#d94f41] focus:border-[#d94f41]' : 'border-[#d4d9d3] focus:border-[#005146]'}`;

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Horarios" />

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {saved && (
            <SuccessBanner
              title="Horario guardado correctamente"
              description="La disponibilidad de reservas ya se calcula con estos días y horas de atención."
              onDismiss={() => setSaved(false)}
            />
          )}

          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">
              Disponibilidad de reservas
            </p>
            <h2 className="text-[#18211e] text-[24px] font-bold leading-tight mt-1">Horario de atención</h2>
            <p className="text-[#66716c] text-[14px] mt-1">
              Define cuándo pueden solicitar una cita tus clientes.
            </p>
          </div>

          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs overflow-hidden">
            <header className="bg-white border-b border-[#ecefe9] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-[#18211e] text-[16px] font-semibold">Horario semanal</h3>
                <p className="text-[#66716c] text-[12px] mt-0.5">
                  Activa los días en que tu negocio presta servicios.
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-[#66716c] text-[12px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Zona horaria: Bogotá (GMT-5)
              </p>
            </header>

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
                <p className="mt-3 text-[#66716c] text-[14px]">Cargando horario...</p>
              </div>
            ) : (
              <ul>
                {DAYS.map(({ key, label }) => {
                  const row = schedule[key];
                  const dayError = errors.days[key];
                  // Highlight only the empty field when hours are missing, both when their order is wrong.
                  const invalid = (value: string) => !!dayError && (!value || (!!row.start && !!row.end));
                  return (
                    <li
                      key={key}
                      className="border-b border-[#ecefe9] px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4"
                    >
                      <div className="sm:w-[150px] shrink-0">
                        <Toggle
                          checked={row.enabled}
                          onChange={(enabled) => updateDay(key, { enabled })}
                          label={label}
                          description={row.enabled ? 'Disponible' : 'No disponible'}
                        />
                      </div>

                      {row.enabled ? (
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-end gap-3">
                            <label className="flex-1 flex flex-col gap-1">
                              <span className="text-[#18211e] text-[14px] font-medium leading-[20px]">Hora de inicio</span>
                              <input
                                type="time"
                                value={row.start}
                                onChange={(e) => updateDay(key, { start: e.target.value })}
                                aria-invalid={invalid(row.start)}
                                className={timeInputClass(invalid(row.start))}
                              />
                            </label>
                            <span className="text-[#66716c] text-[12px] pb-3">a</span>
                            <label className="flex-1 flex flex-col gap-1">
                              <span className="text-[#18211e] text-[14px] font-medium leading-[20px]">Hora de cierre</span>
                              <input
                                type="time"
                                value={row.end}
                                onChange={(e) => updateDay(key, { end: e.target.value })}
                                aria-invalid={invalid(row.end)}
                                className={timeInputClass(invalid(row.end))}
                              />
                            </label>
                          </div>
                          {dayError && <FieldError msg={dayError} />}
                        </div>
                      ) : (
                        <p className="flex-1 text-[#66716c] text-[13px] sm:pt-0.5">No se ofrecerán citas este día.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <footer className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {formError ? (
                <p role="alert" className="text-[#d94f41] text-[12px] leading-[18px]">
                  {formError}
                </p>
              ) : (
                <p className="text-[#66716c] text-[12px] leading-[18px] max-w-[340px]">
                  Solo se mostrarán horas de reserva dentro de este horario y según la duración de cada servicio.
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || saving}
                className="bg-[#005146] hover:bg-[#00403b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                {saving ? 'Guardando...' : 'Guardar horario'}
              </button>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
