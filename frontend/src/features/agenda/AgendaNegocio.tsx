import { Fragment, useEffect, useRef, useState } from 'react';
import { NavBar, ProviderAside } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { AgendaDay, AgendaEntry, AgendaResponse, AgendaView, fetchAgenda } from '@/api/schedule';
import { capitalize, dayKey, fmt, hhmm, longDate, shift, toDate } from '@/utils/dates';

const VIEWS: { value: AgendaView; label: string }[] = [
  { value: 'DIA', label: 'Día' },
  { value: 'SEMANA', label: 'Semana' },
  { value: 'MES', label: 'Mes' },
];
const WEEKDAYS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

function periodTitle(agenda: AgendaResponse, days: AgendaDay[]) {
  if (agenda.view === 'MES') return capitalize(fmt(agenda.from, { month: 'long', year: 'numeric' }));
  const first = days[0].date;
  const last = days[days.length - 1].date;
  if (agenda.view === 'DIA') return longDate(first);
  const end = fmt(last, { day: 'numeric', month: 'long', year: 'numeric' });
  const start = first.slice(0, 7) === last.slice(0, 7) ? String(Number(first.slice(8))) : fmt(first, { day: 'numeric', month: 'long' });
  return `${start} – ${end}`;
}

// Rows cover the business hours of the shown days plus any reservation outside them.
function hourRange(days: AgendaDay[]) {
  const marks = days.flatMap((d) => [
    ...(d.openTime && d.closeTime ? [minutesOf(d.openTime), minutesOf(d.closeTime)] : []),
    ...d.reservations.flatMap((r) => [minutesOf(hhmm(r.startAt)), minutesOf(hhmm(r.endAt))]),
  ]);
  const first = marks.length ? Math.floor(Math.min(...marks) / 60) : 8;
  const last = marks.length ? Math.ceil(Math.max(...marks) / 60) : 18;
  return Array.from({ length: last - first }, (_, i) => first + i);
}

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function EntryCard({ entry, continued, onSelect }: { entry: AgendaEntry; continued: boolean; onSelect: (e: AgendaEntry) => void }) {
  if (entry.status === 'PENDIENTE') {
    return (
      <div className="flex-1 rounded-[6px] bg-[#e4e7e1] px-2.5 py-1.5 flex items-start gap-1.5 text-[11px] text-[#66716c]">
        <span className="mt-0.5"><LockIcon /></span>
        Bloqueado
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="flex-1 w-full text-left rounded-[6px] bg-[#e6f0ef] hover:bg-[#d9e9e7] border-l-2 border-[#005146] px-2.5 py-1.5 transition-colors cursor-pointer"
    >
      {continued ? (
        <p className="text-[11px] text-[#66716c] truncate">Continúa · {entry.clientName}</p>
      ) : (
        <>
          <p className="text-[11px] font-bold text-[#005146] leading-tight">{hhmm(entry.startAt)}</p>
          <p className="text-[12px] font-semibold text-[#18211e] leading-tight truncate">{entry.clientName}</p>
          <p className="text-[11px] text-[#66716c] leading-tight truncate">{entry.serviceName}</p>
        </>
      )}
    </button>
  );
}

function HourCell({ day, hour, onSelect }: { day: AgendaDay; hour: number; onSelect: (e: AgendaEntry) => void }) {
  const start = hour * 60;
  const end = start + 60;
  const busy = day.reservations.filter((r) => minutesOf(hhmm(r.startAt)) < end && minutesOf(hhmm(r.endAt)) > start);
  if (busy.length) {
    return (
      <div className="h-full flex flex-col gap-1">
        {busy.map((r) => (
          <EntryCard key={r.id} entry={r} continued={minutesOf(hhmm(r.startAt)) < start} onSelect={onSelect} />
        ))}
      </div>
    );
  }
  const open = !!day.openTime && !!day.closeTime && minutesOf(day.openTime) < end && minutesOf(day.closeTime) > start;
  return open ? (
    <div className="h-full rounded-[6px] border border-dashed border-[#d4d9d3] bg-[#fcfcf8] flex items-center justify-center text-[11px] text-[#8a938f]">
      Disponible
    </div>
  ) : (
    <div className="h-full rounded-[6px] bg-[#f2f3ee]">
      <span className="sr-only">Fuera del horario de atención</span>
    </div>
  );
}

function TimeGrid({ days, today, onSelect }: { days: AgendaDay[]; today: string; onSelect: (e: AgendaEntry) => void }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))` }}
      >
        <div className="border-b border-[#ecefe9]" />
        {days.map((d) => (
          <div
            key={d.date}
            className={`border-b border-l border-[#ecefe9] py-3 text-center ${d.date === today ? 'bg-[#e6f0ef] text-[#005146]' : 'text-[#18211e]'}`}
          >
            <p className="text-[11px] font-semibold tracking-[0.88px] opacity-70">
              {fmt(d.date, { weekday: 'short' }).replace('.', '').toUpperCase()}
            </p>
            <p className="text-[18px] font-bold leading-tight">{Number(d.date.slice(8))}</p>
          </div>
        ))}
        {hourRange(days).map((hour) => (
          <Fragment key={hour}>
            <div className="border-b border-[#ecefe9] px-3 pt-2 text-right text-[12px] text-[#66716c]">
              {String(hour).padStart(2, '0')}:00
            </div>
            {days.map((d) => (
              <div key={d.date} className="border-b border-l border-[#ecefe9] p-1.5 min-h-[64px]">
                <HourCell day={d} hour={hour} onSelect={onSelect} />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ agenda, today, onSelect }: { agenda: AgendaResponse; today: string; onSelect: (e: AgendaEntry) => void }) {
  const byDate = new Map(agenda.days.map((d) => [d.date, d]));
  const cells: string[] = [];
  // Full weeks from the Monday on/before the 1st to the Sunday on/after the last day.
  for (let d = shift(agenda.from, -((toDate(agenda.from).getUTCDay() + 6) % 7)); d <= agenda.to || toDate(d).getUTCDay() !== 1; d = shift(d, 1)) {
    cells.push(d);
  }
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[640px]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="border-b border-[#ecefe9] py-2.5 text-center text-[11px] font-semibold tracking-[0.88px] text-[#66716c]">
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          const day = byDate.get(date);
          return (
            <div
              key={date}
              className={`min-h-[96px] border-b border-[#ecefe9] p-2 ${i % 7 ? 'border-l' : ''} ${!day?.openTime ? 'bg-[#f6f7f3]' : ''}`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-[12px] rounded-full
                  ${date === today ? 'bg-[#005146] text-white font-bold' : day ? 'text-[#18211e]' : 'text-[#b5bbb6]'}`}
              >
                {Number(date.slice(8))}
              </span>
              <div className="mt-1 flex flex-col gap-1">
                {day?.reservations.map((r) =>
                  r.status === 'PENDIENTE' ? (
                    <div key={r.id} className="rounded-[4px] bg-[#e4e7e1] px-2 py-0.5 text-[10px] text-[#66716c] truncate">
                      Bloqueado
                    </div>
                  ) : (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onSelect(r)}
                      className="text-left rounded-[4px] bg-[#e6f0ef] hover:bg-[#d9e9e7] border-l-2 border-[#005146] px-2 py-0.5 text-[10px] font-semibold text-[#005146] truncate cursor-pointer"
                    >
                      {hhmm(r.startAt)} {r.clientName}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReservationDrawer({ entry, onClose }: { entry: AgendaEntry; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // onClose only clears the selection, so the first one stays valid; re-running would steal focus.
  }, []);

  const initials = entry.clientName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const rows = [
    { label: 'Servicio', value: entry.serviceName, icon: <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /> },
    {
      label: 'Fecha',
      value: longDate(dayKey(entry.startAt)),
      icon: <><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
    },
    {
      label: 'Hora',
      value: `${hhmm(entry.startAt)} – ${hhmm(entry.endAt)} · ${entry.durationMinutes} min`,
      icon: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-[#18211e]/40 animate-modal-backdrop" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-reserva-titulo"
        className="relative w-full max-w-[340px] h-full bg-[#fcfcf8] shadow-xl overflow-y-auto animate-fade-in"
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#ecefe9]">
          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">
              Reserva R-{entry.id.slice(0, 8).toUpperCase()}
            </p>
            <h2 id="detalle-reserva-titulo" className="text-[#18211e] text-[20px] font-bold leading-tight mt-0.5">
              Detalle de la reserva
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="w-8 h-8 shrink-0 rounded-full border border-[#d4d9d3] text-[#66716c] hover:text-[#18211e] hover:bg-[#f2f3ee] flex items-center justify-center cursor-pointer bg-transparent"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="px-5 py-4 flex items-center gap-3 border-b border-[#ecefe9]">
          <div className="w-10 h-10 rounded-full bg-[#e6f0ef] text-[#005146] flex items-center justify-center text-[13px] font-bold">
            {initials}
          </div>
          <div>
            <p className="text-[#18211e] text-[15px] font-semibold">{entry.clientName}</p>
            <span className="inline-block mt-0.5 text-[11px] text-[#005146] bg-[#e6f0ef] px-2 py-0.5 rounded-full font-semibold">
              {entry.status === 'CONFIRMADA' ? 'Confirmada' : 'Pendiente'}
            </span>
          </div>
        </div>

        <dl className="px-5 py-4 flex flex-col gap-4 border-b border-[#ecefe9]">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-[#66716c] mt-0.5 shrink-0">
                {row.icon}
              </svg>
              <div>
                <dt className="text-[#66716c] text-[11px]">{row.label}</dt>
                <dd className="text-[#18211e] text-[14px]">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="px-5 py-4">
          <h3 className="text-[#18211e] text-[14px] font-semibold mb-2">Datos de contacto</h3>
          <div className="bg-[#f2f3ee] rounded-[8px] px-4 py-3 flex flex-col gap-1.5 text-[13px] text-[#66716c]">
            <a href={`tel:${entry.clientPhone}`} className="hover:text-[#005146]">{entry.clientPhone}</a>
            <a href={`mailto:${entry.clientEmail}`} className="hover:text-[#005146] break-all">{entry.clientEmail}</a>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function AgendaNegocio() {
  const { user, showNotification } = useAuth();
  const providerEmail = user?.email || '';
  const today = dayKey(Date.now());
  const [view, setView] = useState<AgendaView>('DIA');
  const [date, setDate] = useState(today);
  const [agenda, setAgenda] = useState<AgendaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AgendaEntry | null>(null);

  useEffect(() => {
    if (!providerEmail) {
      setLoading(false);
      return;
    }
    let current = true;
    setLoading(true);
    fetchAgenda(view, date)
      .then((res) => current && setAgenda(res))
      .catch((err: unknown) => {
        if (current) showNotification('error', err instanceof ApiError ? err.message : 'No se pudo cargar la agenda.');
      })
      .finally(() => current && setLoading(false));
    // showNotification is recreated on every render, so it stays out of the deps.
    return () => {
      current = false;
    };
  }, [providerEmail, view, date]);

  const move = (step: number) =>
    setDate((d) => (view === 'MES' ? shift(d, 0, step) : shift(d, view === 'SEMANA' ? 7 * step : step)));

  // Like the mockup, the week hides the days the business does not attend unless they have reservations.
  const attended = agenda?.days.filter((d) => d.openTime || d.reservations.length) ?? [];
  const days = agenda?.view === 'SEMANA' && attended.length ? attended : agenda?.days ?? [];

  const navButton = 'h-9 min-w-9 px-3 rounded-[8px] border border-[#d4d9d3] bg-white text-[#18211e] text-[13px] font-semibold hover:bg-[#f2f3ee] transition-colors cursor-pointer flex items-center justify-center';

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Agenda" />

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">Panel del proveedor</p>
              <h2 className="text-[#18211e] text-[24px] font-bold leading-tight mt-1">Mi agenda</h2>
              <p className="text-[#66716c] text-[14px] mt-1">Consulta tus reservas y espacios disponibles.</p>
            </div>
            <div className="inline-flex bg-[#e4e7e1] rounded-[10px] p-1 self-start sm:self-auto" role="group" aria-label="Vista de la agenda">
              {VIEWS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  aria-pressed={view === v.value}
                  onClick={() => setView(v.value)}
                  className={`px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer
                    ${view === v.value ? 'bg-white text-[#005146] shadow-xs' : 'text-[#66716c] hover:text-[#18211e]'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs overflow-hidden">
            <header className="bg-white border-b border-[#ecefe9] px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => move(-1)} className={navButton} aria-label="Periodo anterior">‹</button>
                <button type="button" onClick={() => setDate(today)} className={navButton}>Hoy</button>
                <button type="button" onClick={() => move(1)} className={navButton} aria-label="Periodo siguiente">›</button>
                <h3 className="text-[#18211e] text-[16px] font-bold ml-2" aria-live="polite">
                  {agenda && days.length ? periodTitle(agenda, days) : ''}
                </h3>
              </div>
              <ul className="flex items-center gap-4 text-[12px] text-[#66716c]">
                <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#e6f0ef] border-l-2 border-[#005146]" />Reserva</li>
                <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#b5bbb6]" />Disponible</li>
                <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d4d9d3]" />Bloqueado</li>
              </ul>
            </header>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
                <p className="mt-3 text-[#66716c] text-[14px]">Cargando agenda...</p>
              </div>
            ) : agenda ? (
              <>
                {agenda.message && (
                  <p role="status" className="mx-5 my-4 rounded-[8px] bg-[#f2f3ee] px-4 py-2.5 text-[13px] text-[#66716c]">
                    {agenda.message}
                  </p>
                )}
                <div>
                  {agenda.view === 'MES' ? (
                    <MonthGrid agenda={agenda} today={today} onSelect={setSelected} />
                  ) : (
                    <TimeGrid days={days} today={today} onSelect={setSelected} />
                  )}
                </div>
              </>
            ) : (
              <p className="text-center py-16 text-[#66716c] text-[14px]">No fue posible cargar la agenda.</p>
            )}
          </section>
        </div>
      </main>

      {selected && <ReservationDrawer entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
