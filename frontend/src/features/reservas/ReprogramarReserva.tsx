import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import type { AvailabilityResponse } from '@/api/services';
import {
  RescheduleResponse,
  cancelReschedule,
  confirmReschedule,
  fetchRescheduleAvailability,
  holdReschedule,
} from '@/api/reservations';
import { capitalize, dayKey, fmt, hhmm, longDate, shift } from '@/utils/dates';
import { statusMeta } from './reservationStatus';

/** HU-19: detalle → elegir nuevo horario → revisar el cambio → reprogramada. */
type Step = 'detalle' | 'seleccion' | 'resumen' | 'exito';

interface Alert {
  title: string;
  description: string;
}

// Same window as booking; the backend accepts up to 31 days per query.
const WINDOW_DAYS = 28;

// The backend answers in plain ASCII; the UI shows the same messages with accents.
const FRIENDLY: Record<string, string> = {
  'No puedes reprogramar una reserva que ya pasó': 'No puedes reprogramar esta reserva porque su fecha y hora ya pasaron.',
  'No puedes reprogramar una reserva cancelada': 'No puedes reprogramar una reserva cancelada.',
  'Solo puedes reprogramar reservas confirmadas': 'Solo puedes reprogramar reservas confirmadas.',
  'El horario seleccionado ya no esta disponible': 'Otro cliente tomó ese horario. Selecciona una nueva fecha u hora.',
  'El horario seleccionado esta fuera del horario de atencion del proveedor':
    'El horario seleccionado está fuera del horario de atención del proveedor.',
  'Selecciona un horario diferente al actual': 'Selecciona un horario diferente al actual.',
  'No hay un cambio de horario pendiente. Selecciona un nuevo horario':
    'No hay un cambio de horario pendiente. Selecciona un nuevo horario.',
};

const message = (err: unknown) =>
  err instanceof ApiError ? FRIENDLY[err.message] ?? err.message : 'Ocurrió un error inesperado. Intenta de nuevo.';

const range = (start: string, end: string) => `${hhmm(start)} – ${hhmm(end)}`;

const eyebrow = 'text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase';
const card = 'bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs';
const primaryButton =
  'bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton =
  'border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-60';

function AlertBanner({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 bg-[#fdf1f0] border border-[#f3c4be] rounded-[10px] px-5 py-4">
      <div className="w-7 h-7 rounded-full bg-[#d94f41] text-white flex items-center justify-center shrink-0 text-[14px] font-bold">!</div>
      <div className="flex-1">
        <p className="text-[#18211e] text-[14px] font-semibold leading-[20px]">{alert.title}</p>
        <p className="text-[#66716c] text-[13px] leading-[19px] mt-0.5">{alert.description}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Cerrar aviso" className="text-[#66716c] hover:text-[#18211e] cursor-pointer bg-transparent">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function Rows({ rows, highlight }: { rows: [string, string][]; highlight?: boolean }) {
  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-3 border-b border-[#ecefe9] last:border-b-0 text-[13px]">
          <dt className="text-[#66716c]">{label}</dt>
          <dd className={`font-medium text-right ${highlight ? 'text-[#005146] font-semibold' : 'text-[#18211e]'}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  return (
    <p className="text-[#66716c] text-[12px]">
      {left > 0
        ? `Guardamos el nuevo horario por ${mmss} minutos mientras confirmas.`
        : 'El tiempo para confirmar terminó; al confirmar revisaremos si el horario sigue libre.'}
    </p>
  );
}

export default function ReprogramarReserva() {
  const { navigate, selectedReservation, showNotification } = useAuth();
  const [step, setStep] = useState<Step>('detalle');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [change, setChange] = useState<RescheduleResponse | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's title so screen readers announce the change.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  if (!selectedReservation) {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[800px] mx-auto px-6 py-12">
          <EmptyState
            title="Elige una reserva"
            description="Abre una de tus reservas desde “Mis reservas” para ver su detalle o reprogramarla."
            actionText="Ir a mis reservas"
            onAction={() => navigate('reservas')}
          />
        </main>
      </div>
    );
  }

  const reservation = selectedReservation;
  const goTo = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Loads the provider's real free slots; the backend refuses past, cancelled or unconfirmed reservations. */
  async function loadAvailability(nextAlert: Alert | null = null) {
    const today = dayKey(Date.now());
    setLoading(true);
    setAlert(nextAlert);
    try {
      const res = await fetchRescheduleAvailability(reservation.id, today, shift(today, WINDOW_DAYS - 1));
      setAvailability(res);
      setDate((d) => (res.days.some((day) => day.date === d) ? d : res.days[0]?.date ?? ''));
      setSlot('');
      goTo('seleccion');
    } catch (err: unknown) {
      setAlert({ title: 'No es posible reprogramar esta reserva', description: message(err) });
      goTo('detalle');
    } finally {
      setLoading(false);
    }
  }

  async function reviewChange() {
    if (!slot) return;
    setBusy(true);
    setAlert(null);
    try {
      setChange(await holdReschedule(reservation.id, slot));
      goTo('resumen');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && /^(No puedes|Solo puedes) reprogramar/.test(err.message)) {
        setAlert({ title: 'No es posible reprogramar esta reserva', description: message(err) });
        goTo('detalle');
      } else {
        await loadAvailability({ title: 'No pudimos apartar ese horario', description: message(err) });
      }
    } finally {
      setBusy(false);
    }
  }

  /** "Cambiar selección" / "Cancelar": the reservation keeps its slot and the chosen one is freed. */
  async function discardChange(next: 'seleccion' | 'detalle') {
    setBusy(true);
    try {
      await cancelReschedule(reservation.id);
    } catch {
      // Best effort: an unconfirmed hold also frees itself when it expires.
    } finally {
      setBusy(false);
    }
    setChange(null);
    if (next === 'seleccion') {
      await loadAvailability();
    } else {
      setAlert(null);
      showNotification('info', 'No se aplicó la reprogramación. Tu reserva mantiene su fecha y hora originales.');
      goTo('detalle');
    }
  }

  async function confirmChange() {
    setBusy(true);
    try {
      const done = await confirmReschedule(reservation.id);
      setChange(done);
      setAlert(null);
      showNotification('success', 'Tu reserva fue reprogramada exitosamente.');
      goTo('exito');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 410) {
        await loadAvailability({
          title: 'El tiempo para confirmar terminó',
          description: 'Liberamos el horario que habías elegido. Selecciona nuevamente la fecha y la hora.',
        });
      } else {
        setAlert({ title: 'No pudimos reprogramar tu reserva', description: message(err) });
      }
    } finally {
      setBusy(false);
    }
  }

  const page = (width: string, children: ReactNode) => (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className={`flex-1 w-full ${width} mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5`}>{children}</main>
    </div>
  );

  // ─── Reprogramada ───────────────────────────
  if (step === 'exito' && change?.newStartAt && change.newEndAt) {
    return page(
      'max-w-[460px] py-16',
      <div className={`${card} p-6 text-center flex flex-col items-center gap-3`}>
        <div className="w-12 h-12 rounded-full bg-[#005146] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[22px] font-bold outline-none">
          Reserva reprogramada
        </h1>
        <p className="text-[#66716c] text-[14px]">
          Tu cita de {change.serviceName} quedó para el {fmt(dayKey(change.newStartAt), { weekday: 'long', day: 'numeric', month: 'long' })}{' '}
          a las {hhmm(change.newStartAt)}. Notificamos a {change.businessName} con ambos horarios.
        </p>
        <div className="w-full bg-[#f2f3ee] rounded-[10px] px-4 py-1 text-left">
          <Rows
            rows={[
              ['Horario anterior', `${capitalize(fmt(dayKey(change.previousStartAt), { weekday: 'short', day: 'numeric', month: 'short' }))} · ${range(change.previousStartAt, change.previousEndAt)}`],
              ['Nuevo horario', `${capitalize(fmt(dayKey(change.newStartAt), { weekday: 'short', day: 'numeric', month: 'short' }))} · ${range(change.newStartAt, change.newEndAt)}`],
            ]}
          />
        </div>
        <button type="button" onClick={() => navigate('reservas')} className={`${primaryButton} w-full mt-1`}>
          Ver mis reservas
        </button>
      </div>
    );
  }

  // ─── Revisar el cambio (mockup 03) ──────────
  if (step === 'resumen' && change?.newStartAt && change.newEndAt) {
    return page(
      'max-w-[680px]',
      <>
        <div>
          <p className={eyebrow}>Resumen de reprogramación</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[24px] font-bold leading-tight mt-1 outline-none">
            Revisa el cambio de horario
          </h1>
        </div>
        {alert && <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className={`${card} px-5 py-4`}>
            <h2 className="text-[#66716c] text-[11px] font-semibold tracking-[0.88px] uppercase">Horario anterior</h2>
            <Rows
              rows={[
                ['Fecha', capitalize(fmt(dayKey(change.previousStartAt), { weekday: 'long', day: 'numeric', month: 'long' }))],
                ['Hora', range(change.previousStartAt, change.previousEndAt)],
              ]}
            />
          </section>
          <section className={`${card} px-5 py-4 border-[#005146]`}>
            <h2 className={eyebrow}>Nuevo horario</h2>
            <Rows
              highlight
              rows={[
                ['Fecha', longDate(dayKey(change.newStartAt))],
                ['Hora', range(change.newStartAt, change.newEndAt)],
              ]}
            />
          </section>
        </div>
        <div className="bg-[#e6f0ef] border border-[#b8d4d1] rounded-[10px] px-5 py-3.5 flex flex-col gap-1">
          <p className="text-[#18211e] text-[13px] leading-[19px]">
            Al confirmar, el horario anterior se liberará y el nuevo quedará reservado. {change.businessName} recibirá
            una notificación con ambos horarios.
          </p>
          {change.holdExpiresAt && <HoldCountdown expiresAt={change.holdExpiresAt} />}
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
          {/* "Cancelar": no se aplica el cambio, la reserva conserva su horario y el elegido se libera. */}
          <button
            type="button"
            onClick={() => discardChange('detalle')}
            disabled={busy}
            className="text-[#66716c] hover:text-[#18211e] text-[13px] font-semibold underline bg-transparent cursor-pointer disabled:opacity-60 w-fit"
          >
            Cancelar
          </button>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button type="button" onClick={() => discardChange('seleccion')} disabled={busy} className={secondaryButton}>
              Cambiar selección
            </button>
            <button type="button" onClick={confirmChange} disabled={busy} className={primaryButton}>
              {busy ? 'Confirmando...' : 'Continuar'}
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Elegir nuevo horario (mockup 02) ───────
  if (step === 'seleccion' && availability) {
    const slots = availability.days.find((d) => d.date === date)?.slots ?? [];
    return page(
      'max-w-[860px]',
      <>
        <div>
          <button
            type="button"
            onClick={() => {
              setAlert(null);
              goTo('detalle');
            }}
            className="flex items-center gap-1.5 text-[#66716c] hover:text-[#18211e] text-[13px] mb-4 cursor-pointer bg-transparent"
          >
            <span aria-hidden="true">←</span> Volver al detalle
          </button>
          <p className={eyebrow}>Seleccionar nueva fecha y hora</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[24px] font-bold leading-tight mt-1 outline-none">
            Elige un nuevo horario
          </h1>
          <p className="text-[#66716c] text-[14px] mt-1">
            Solo se muestran espacios compatibles con los {availability.durationMinutes} minutos del servicio.
          </p>
        </div>

        {alert && <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />}

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
          <section className={`${card} p-5`}>
            {availability.days.length === 0 ? (
              <div role="status" className="py-10 text-center flex flex-col items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-[#ecefe9] text-[#66716c] flex items-center justify-center mb-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M3 10h18M8 3v4M16 3v4M10 14l4 4M14 14l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="text-[#18211e] text-[17px] font-bold">No hay horarios disponibles</h2>
                <p className="text-[#66716c] text-[13px] max-w-[340px]">
                  {reservation.businessName} no tiene espacios libres en las próximas semanas. Tu reserva se mantiene en su horario actual.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-[#18211e] text-[14px] font-semibold mb-3">Fechas disponibles</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availability.days.map(({ date: day }) => {
                    const selected = day === date;
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selected}
                        aria-label={longDate(day)}
                        onClick={() => {
                          setDate(day);
                          setSlot('');
                        }}
                        className={`rounded-[8px] py-2.5 flex flex-col items-center border transition-colors cursor-pointer
                          ${selected ? 'bg-[#005146] border-[#005146] text-white' : 'bg-white border-[#d4d9d3] text-[#18211e] hover:border-[#005146]'}`}
                      >
                        <span className="text-[10px] font-semibold uppercase">{fmt(day, { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-[18px] font-bold leading-tight">{Number(day.slice(8))}</span>
                        <span className={`text-[10px] ${selected ? 'text-white/80' : 'text-[#66716c]'}`}>
                          {fmt(day, { month: 'short' }).replace('.', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <h2 className="text-[#18211e] text-[14px] font-semibold mt-5 mb-3">
                  Horarios para {date ? fmt(date, { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={s === slot}
                      onClick={() => setSlot(s)}
                      className={`rounded-[8px] border py-2.5 text-[14px] font-semibold transition-colors cursor-pointer
                        ${s === slot ? 'bg-[#e6f0ef] border-[#005146] text-[#005146]' : 'bg-white border-[#d4d9d3] text-[#18211e] hover:border-[#005146]'}`}
                    >
                      {hhmm(s)}
                    </button>
                  ))}
                </div>
                <p className="mt-4 rounded-[8px] bg-[#f2f3ee] px-4 py-3 text-[12px] text-[#66716c]">
                  Los horarios ocupados o bloqueados por {reservation.businessName} se excluyen automáticamente. Zona horaria de Bogotá.
                </p>
              </>
            )}
          </section>

          <aside className={`${card} p-4 md:sticky md:top-24`}>
            <h2 className="text-[#18211e] text-[14px] font-semibold pb-1 border-b border-[#ecefe9]">Nueva cita</h2>
            <Rows
              rows={[
                ['Fecha', date ? capitalize(fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })) : 'Por seleccionar'],
                ['Hora', slot ? hhmm(slot) : 'Por seleccionar'],
              ]}
            />
            <button type="button" onClick={reviewChange} disabled={busy || !slot} className={`${primaryButton} w-full mt-3`}>
              {busy ? 'Apartando horario...' : 'Revisar cambio'}
            </button>
          </aside>
        </div>
      </>
    );
  }

  // ─── Detalle con reprogramación (mockup 01) ─
  const day = dayKey(reservation.startAt);
  const badge = statusMeta(reservation.status);
  return page(
    'max-w-[680px]',
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={eyebrow}>Detalle con reprogramación</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[26px] font-bold leading-tight mt-1 outline-none">
            {reservation.serviceName}
          </h1>
          <p className="text-[#66716c] text-[14px] mt-1">
            {reservation.businessName} · Reserva R-{reservation.id.slice(0, 4).toUpperCase()}
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border shrink-0 mt-6 ${badge.tone}`}>
          {badge.label}
        </span>
      </div>

      {alert && <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />}

      <section className={`${card} px-5 py-2`}>
        <Rows
          rows={[
            ['Fecha', longDate(day)],
            ['Hora', range(reservation.startAt, reservation.endAt)],
            ['Servicio', `${reservation.serviceName} · ${reservation.durationMinutes} min`],
          ]}
        />
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('reservas')}
          className="text-[#005146] text-[13px] font-semibold underline bg-transparent cursor-pointer w-fit"
        >
          Volver a mis reservas
        </button>
        <button type="button" onClick={() => loadAvailability()} disabled={loading} className={primaryButton}>
          {loading ? 'Buscando horarios...' : 'Reprogramar reserva'}
        </button>
      </div>
    </>
  );
}
