import { useEffect, useRef, useState } from 'react';
import { NavBar } from '@/components/layout';
import { ApiError } from '@/api/client';
import { AvailabilityResponse, fetchAvailability } from '@/api/services';
import { ReservationResponse, rescheduleReservation } from '@/api/reservations';
import { capitalize, dayKey, fmt, hhmm, longDate, shift } from '@/utils/dates';
import { Alert, AlertBanner, SummaryRows } from './ReservarCita';

// Same "próxima disponibilidad" window as the booking screen.
const WINDOW_DAYS = 28;

interface Props {
  reservation: ReservationResponse;
  onCancel: () => void;
  onDone: (updated: ReservationResponse) => void;
}

const eyebrow = 'text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase';
const card = 'bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs';
const primaryButton =
  'bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton =
  'border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors cursor-pointer';
const backLink = 'flex items-center gap-1.5 text-[#66716c] hover:text-[#18211e] text-[13px] mb-4 cursor-pointer bg-transparent';

/** HU-19: choose a new free slot for an active reservation, review old vs new, then confirm. */
export default function ReprogramarReserva({ reservation, onCancel, onDone }: Props) {
  const today = dayKey(Date.now());
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [step, setStep] = useState<'seleccion' | 'confirmacion'>('seleccion');
  const [alert, setAlert] = useState<Alert | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let current = true;
    setAvailability(null);
    setLoadError('');
    fetchAvailability(reservation.serviceId, today, shift(today, WINDOW_DAYS - 1))
      .then((res) => {
        if (!current) return;
        setAvailability(res);
        setDate((d) => (res.days.some((day) => day.date === d) ? d : res.days[0]?.date ?? ''));
      })
      .catch((err: unknown) => current && setLoadError(err instanceof ApiError ? err.message : 'Intenta de nuevo.'));
    return () => {
      current = false;
    };
    // reloadKey forces a refresh after a failed change; today only changes at midnight.
  }, [reloadKey]);

  // Move focus to the new step's title so screen readers announce the change.
  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const business = reservation.businessName;
  const minutes = reservation.durationMinutes;
  const range = (start: string) => `${hhmm(start)} – ${hhmm(new Date(new Date(start).getTime() + minutes * 60000).toISOString())}`;
  const slots = availability?.days.find((d) => d.date === date)?.slots ?? [];

  async function handleConfirm() {
    setBusy(true);
    try {
      onDone(await rescheduleReservation(reservation.id, slot));
    } catch (err: unknown) {
      setAlert({
        title: 'No pudimos reprogramar tu reserva',
        description: `${err instanceof ApiError ? err.message : 'Intenta de nuevo.'}. Tu reserva sigue en su horario original.`,
      });
      setSlot('');
      setStep('seleccion');
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  if (step === 'confirmacion') {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[720px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
          <div>
            <button type="button" onClick={() => setStep('seleccion')} className={backLink}>
              <span aria-hidden="true">‹</span> Cambiar selección
            </button>
            <p className={eyebrow}>Reprogramar reserva</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[24px] font-bold leading-tight mt-1 outline-none">
              Revisa el cambio de horario
            </h1>
            <p className="text-[#66716c] text-[14px] mt-1">{reservation.serviceName} en {business}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <section className={`${card} px-4 py-3`}>
              <h2 className="text-[#66716c] text-[11px] font-semibold tracking-[0.88px] uppercase pt-1">Horario anterior</h2>
              <SummaryRows rows={[['Fecha', longDate(dayKey(reservation.startAt))], ['Hora', range(reservation.startAt)]]} />
            </section>
            <section className={`${card} border-[#005146] px-4 py-3`}>
              <h2 className={`${eyebrow} pt-1`}>Nuevo horario</h2>
              <SummaryRows rows={[['Fecha', longDate(dayKey(slot))], ['Hora', range(slot)]]} />
            </section>
          </div>

          <p className="rounded-[8px] bg-[#e6f0ef] border border-[#b8d4d1] px-4 py-3 text-[13px] text-[#18211e]">
            Al confirmar, el horario anterior se liberará y el nuevo quedará reservado. {business} recibirá una notificación con ambos horarios.
          </p>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button type="button" onClick={onCancel} disabled={busy} className={secondaryButton}>
              Cancelar
            </button>
            <button type="button" onClick={handleConfirm} disabled={busy} className={primaryButton}>
              {busy ? 'Confirmando...' : 'Confirmar cambio'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-[840px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">
        <div>
          <button type="button" onClick={onCancel} className={backLink}>
            <span aria-hidden="true">‹</span> Volver a mis reservas
          </button>
          <p className={eyebrow}>Reprogramar · {reservation.serviceName}</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[24px] font-bold leading-tight mt-1 outline-none">
            Elige un nuevo horario
          </h1>
          <p className="text-[#66716c] text-[14px] mt-1">Solo se muestran espacios compatibles con los {minutes} minutos del servicio.</p>
        </div>

        {alert && <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />}

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_250px] gap-4 items-start">
          <section className={`${card} p-5 flex flex-col gap-5`}>
            {loadError ? (
              <p role="alert" className="text-[#d94f41] text-[14px]">No pudimos cargar los horarios: {loadError}</p>
            ) : !availability ? (
              <div className="text-center py-12" role="status">
                <div className="inline-block animate-spin w-7 h-7 border-4 border-[#005146] border-t-transparent rounded-full" />
                <p className="mt-3 text-[#66716c] text-[14px]">Buscando horarios disponibles...</p>
              </div>
            ) : availability.days.length === 0 ? (
              <div role="status" className="py-10 text-center flex flex-col items-center gap-2">
                <h2 className="text-[#18211e] text-[17px] font-bold">No hay horarios disponibles</h2>
                <p className="text-[#66716c] text-[13px] max-w-[360px]">
                  {business} no tiene horarios libres en las próximas semanas. Tu reserva se mantiene en su horario actual.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-[#18211e] text-[15px] font-semibold mb-3">Fechas disponibles</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {availability.days.map(({ date: day }) => (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={day === date}
                        aria-label={longDate(day)}
                        onClick={() => {
                          setDate(day);
                          setSlot('');
                        }}
                        className={`rounded-[8px] border py-2 flex flex-col items-center transition-colors cursor-pointer
                          ${day === date ? 'bg-[#005146] border-[#005146] text-white' : 'bg-white border-[#d4d9d3] text-[#18211e] hover:border-[#005146]'}`}
                      >
                        <span className="text-[10px] font-semibold uppercase">{fmt(day, { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-[17px] font-bold leading-tight">{Number(day.slice(8))}</span>
                        <span className="text-[10px] uppercase opacity-80">{fmt(day, { month: 'short' }).replace('.', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-[#18211e] text-[15px] font-semibold mb-3">
                    Horarios para el {fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                </div>
                <p className="rounded-[8px] bg-[#f2f3ee] px-4 py-3 text-[12px] text-[#66716c]">
                  Los horarios ocupados o bloqueados por {business} se excluyen automáticamente. Hora de Bogotá.
                </p>
              </>
            )}
          </section>

          <aside className={`${card} p-4 md:sticky md:top-24`}>
            <h2 className="text-[#18211e] text-[14px] font-semibold pb-3 border-b border-[#ecefe9]">Nueva cita</h2>
            <SummaryRows
              rows={[
                ['Fecha', date ? capitalize(fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })) : 'Por seleccionar'],
                ['Hora', slot ? range(slot) : 'Por seleccionar'],
              ]}
            />
            <button type="button" onClick={() => setStep('confirmacion')} disabled={!slot} className={`${primaryButton} w-full mt-4`}>
              Revisar cambio
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
