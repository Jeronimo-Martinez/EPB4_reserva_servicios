import { useEffect, useRef, useState } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState, SelectField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { AvailabilityResponse, BusinessDetail, fetchAvailability, fetchBusiness } from '@/api/services';
import { ReservationResponse, confirmReservation, createHold } from '@/api/reservations';
import { capitalize, cop, dayKey, fmt, hhmm, longDate, shift, toDate } from '@/utils/dates';

type Step = 'seleccion' | 'confirmacion' | 'confirmada';

interface Alert {
  title: string;
  description: string;
}

// The backend accepts up to 31 days per query; four weeks is the "próxima disponibilidad" shown.
const WINDOW_DAYS = 28;
const SLOT_TAKEN = 'El horario seleccionado ya no esta disponible';

const sundayOf = (day: string) => shift(day, -toDate(day).getUTCDay());
const monthName = (day: string) => capitalize(fmt(day, { month: 'long' }));

function weekLabel(week: string[]) {
  const [first, last] = [week[0], week[6]];
  const year = last.slice(0, 4);
  return first.slice(0, 7) === last.slice(0, 7)
    ? `${monthName(first)} ${year}`
    : `${monthName(first)} – ${monthName(last)} ${year}`;
}

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

function HoldNotice({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-start gap-3 bg-[#e6f0ef] border border-[#b8d4d1] rounded-[10px] px-5 py-4">
      <div className="w-7 h-7 rounded-full bg-[#005146] flex items-center justify-center shrink-0 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-[#18211e] text-[14px] font-semibold leading-[20px]">
          {left > 0 ? `Horario reservado temporalmente por ${mmss} minutos` : 'El tiempo de reserva temporal terminó'}
        </p>
        <p className="text-[#66716c] text-[13px] leading-[19px] mt-0.5">
          {left > 0
            ? 'Conservaremos este cupo mientras revisas los datos. La reserva aún no ha sido creada.'
            : 'Si confirmas ahora revisaremos si el horario sigue disponible.'}
        </p>
      </div>
    </div>
  );
}

function NoAvailability({ description, actionText, onAction }: { description: string; actionText?: string; onAction?: () => void }) {
  return (
    <div role="status" className="px-6 py-14 text-center flex flex-col items-center gap-2">
      <div className="w-11 h-11 rounded-full bg-[#ecefe9] text-[#66716c] flex items-center justify-center mb-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10h18M8 3v4M16 3v4M10 14l4 4M14 14l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-[#18211e] text-[17px] font-bold">No hay disponibilidad próxima</h3>
      <p className="text-[#66716c] text-[13px] max-w-[340px]">{description}</p>
      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-colors cursor-pointer bg-transparent"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

function SummaryRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 py-2.5 border-b border-[#ecefe9] last:border-b-0 text-[13px]">
          <dt className="text-[#66716c]">{label}</dt>
          <dd className="text-[#18211e] font-medium text-right">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function ReservarCita() {
  const { navigate, bookingService, openBusiness } = useAuth();
  const today = dayKey(Date.now());
  const windowEnd = shift(today, WINDOW_DAYS - 1);

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [serviceId, setServiceId] = useState(bookingService?.id || '');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [weekStart, setWeekStart] = useState(sundayOf(today));
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [alert, setAlert] = useState<Alert | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>('seleccion');
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!bookingService?.businessId) return;
    fetchBusiness(bookingService.businessId).then(setBusiness).catch(() => setBusiness(null));
  }, [bookingService?.businessId]);

  useEffect(() => {
    if (!serviceId) return;
    let current = true;
    setLoadingSlots(true);
    fetchAvailability(serviceId, today, windowEnd)
      .then((res) => {
        if (!current) return;
        setAvailability(res);
        // Keep the chosen date while it still has slots; otherwise jump to the first date that does.
        setDate((d) => (res.days.some((day) => day.date === d) ? d : res.days[0]?.date ?? ''));
      })
      .catch((err: unknown) => {
        if (current) setAlert({ title: 'No pudimos cargar la disponibilidad', description: err instanceof ApiError ? err.message : 'Intenta de nuevo.' });
      })
      .finally(() => current && setLoadingSlots(false));
    return () => {
      current = false;
    };
    // today/windowEnd only change at midnight; reloadKey forces a refresh after a failed hold.
  }, [serviceId, reloadKey]);

  useEffect(() => {
    if (date) setWeekStart(sundayOf(date));
  }, [date]);

  // Move focus to the new step's title so screen readers announce the change.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  if (!bookingService) {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[800px] mx-auto px-6 py-12">
          <EmptyState
            title="Elige un servicio para reservar"
            description="Busca un servicio en el catálogo y pulsa “Reservar cita” para elegir fecha y hora."
            actionText="Ir al catálogo"
            onAction={() => navigate('catalogo')}
          />
        </main>
      </div>
    );
  }

  // Only bookable services go in the selector; the one the client clicked is always there.
  const services = business?.services.filter((s) => s.available || s.id === bookingService.id) ?? [bookingService];
  const service = services.find((s) => s.id === serviceId);
  const businessName = business?.name ?? bookingService.businessName ?? '';
  const week = Array.from({ length: 7 }, (_, i) => shift(weekStart, i));
  const slotsByDate = new Map(availability?.days.map((d) => [d.date, d.slots]) ?? []);
  const slots = slotsByDate.get(date) ?? [];
  const availableDates = availability?.days.map((d) => d.date) ?? [];
  const weekHasSlots = week.some((day) => slotsByDate.has(day));
  const earlier = availableDates.filter((d) => d < week[0]).pop();
  const nearest = earlier ?? availableDates.find((d) => d > week[6]);
  const goToStep = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function backToSelection(nextAlert: Alert | null) {
    setAlert(nextAlert);
    setSlot('');
    setReservation(null);
    setReloadKey((k) => k + 1);
    goToStep('seleccion');
  }

  async function handleContinue() {
    if (!service || !date || !slot) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setAlert(null);
    setBusy(true);
    try {
      setReservation(await createHold(service.id, slot));
      goToStep('confirmacion');
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'No fue posible reservar el horario.';
      setAlert(
        message === SLOT_TAKEN
          ? {
              title: 'El horario seleccionado ya no está disponible',
              description: `Otro cliente reservó el horario de las ${hhmm(slot)}. Selecciona una nueva fecha u hora para continuar.`,
            }
          : { title: 'No pudimos reservar ese horario', description: message }
      );
      setSlot('');
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!reservation) return;
    setBusy(true);
    try {
      setReservation(await confirmReservation(reservation.id));
      setAlert(null);
      goToStep('confirmada');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 410) {
        backToSelection({
          title: 'Tu reserva temporal expiró',
          description: 'Liberamos el horario. Selecciona nuevamente una fecha y hora para completar tu reserva.',
        });
      } else {
        setAlert({ title: 'No pudimos confirmar tu reserva', description: err instanceof ApiError ? err.message : 'Intenta de nuevo.' });
      }
    } finally {
      setBusy(false);
    }
  }

  const eyebrow = 'text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase';
  const card = 'bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs';
  const primaryButton =
    'bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

  if (step === 'confirmada' && reservation) {
    const day = dayKey(reservation.startAt);
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[440px] mx-auto px-6 py-16">
          <div className={`${card} p-6 text-center flex flex-col items-center gap-3`}>
            <div className="w-12 h-12 rounded-full bg-[#005146] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[22px] font-bold outline-none">
              Reserva confirmada
            </h1>
            <p className="text-[#66716c] text-[14px]">
              Tu cita en {reservation.businessName} quedó agendada para el{' '}
              {fmt(day, { weekday: 'long', day: 'numeric', month: 'long' })} a las {hhmm(reservation.startAt)}.
            </p>
            <div className="w-full bg-[#f2f3ee] rounded-[10px] px-4 py-1.5 text-left">
              <SummaryRows
                rows={[
                  ['Servicio', reservation.serviceName],
                  ['Duración', `${reservation.durationMinutes} min`],
                  ['Total', cop(reservation.totalPrice)],
                ]}
              />
            </div>
            <button type="button" onClick={() => navigate('reservas')} className={`${primaryButton} w-full mt-1`}>
              Ver mis reservas
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'confirmacion' && reservation) {
    return (
      <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[640px] mx-auto px-6 py-8 flex flex-col gap-5">
          <div>
            <p className={eyebrow}>Último paso</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[24px] font-bold leading-tight mt-1 outline-none">
              Revisa y confirma tu cita
            </h1>
            <p className="text-[#66716c] text-[14px] mt-1">Verifica que la información sea correcta antes de reservar.</p>
          </div>

          {reservation.holdExpiresAt && <HoldNotice expiresAt={reservation.holdExpiresAt} />}
          {alert && <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />}

          <section className={`${card} px-5 py-4`}>
            <h2 className="text-[#18211e] text-[16px] font-semibold pb-3 border-b border-[#ecefe9]">Resumen de la cita</h2>
            <SummaryRows
              rows={[
                ['Negocio', reservation.businessName],
                ['Servicio', reservation.serviceName],
                ['Duración', `${reservation.durationMinutes} min`],
                ['Fecha', longDate(dayKey(reservation.startAt))],
                ['Hora', `${hhmm(reservation.startAt)} · Bogotá (GMT-5)`],
                ['Total', cop(reservation.totalPrice)],
              ]}
            />
          </section>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => backToSelection(null)}
              disabled={busy}
              className="border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[14px] px-5 py-[11px] rounded-[8px] transition-colors cursor-pointer"
            >
              Cambiar horario
            </button>
            <button type="button" onClick={handleConfirm} disabled={busy} className={primaryButton}>
              {busy ? 'Confirmando...' : 'Confirmar reserva'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 w-full max-w-[840px] mx-auto px-6 py-8 flex flex-col gap-5">
        <div>
          <button
            type="button"
            onClick={() => (bookingService.businessId ? openBusiness(bookingService.businessId) : navigate('catalogo'))}
            className="flex items-center gap-1.5 text-[#66716c] hover:text-[#18211e] text-[13px] mb-4 cursor-pointer bg-transparent"
          >
            <span aria-hidden="true">‹</span> Volver a {businessName}
          </button>
          <p className={eyebrow}>Reserva en {businessName}</p>
          <h1 ref={headingRef} tabIndex={-1} className="text-[#18211e] text-[24px] font-bold leading-tight mt-1 outline-none">
            Selecciona servicio, fecha y hora
          </h1>
          <p className="text-[#66716c] text-[14px] mt-1">Elige una opción disponible para reservar tu cita.</p>
        </div>

        {alert && <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />}

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_250px] gap-4 items-start">
          <section className={`${card} p-4`}>
            <SelectField
              label="Servicio"
              value={serviceId}
              onChange={(id) => {
                setServiceId(id);
                setSlot('');
                setMissing(false);
              }}
              placeholder="Selecciona un servicio"
              options={services.map((s) => ({ value: s.id, label: `${s.name} · ${s.durationMinutes} min · ${cop(s.price)}` }))}
            />
          </section>

          <section className={`${card} md:row-start-2 overflow-hidden`}>
            <header className="flex items-center justify-between px-5 py-3.5 border-b border-[#ecefe9]">
              <button
                type="button"
                onClick={() => setWeekStart(shift(weekStart, -7))}
                disabled={weekStart <= sundayOf(today)}
                aria-label="Semana anterior"
                className="w-8 h-8 rounded-full text-[#18211e] hover:bg-[#f2f3ee] disabled:text-[#c4c9c4] disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed bg-transparent"
              >
                ‹
              </button>
              <h2 className="text-[#18211e] text-[15px] font-semibold">{weekLabel(week)}</h2>
              <button
                type="button"
                onClick={() => setWeekStart(shift(weekStart, 7))}
                disabled={shift(weekStart, 7) > windowEnd}
                aria-label="Semana siguiente"
                className="w-8 h-8 rounded-full text-[#18211e] hover:bg-[#f2f3ee] disabled:text-[#c4c9c4] disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed bg-transparent"
              >
                ›
              </button>
            </header>

            {loadingSlots ? (
              <div className="text-center py-14">
                <div className="inline-block animate-spin w-7 h-7 border-4 border-[#005146] border-t-transparent rounded-full" />
                <p className="mt-3 text-[#66716c] text-[14px]">Buscando horarios disponibles...</p>
              </div>
            ) : !availability || availableDates.length === 0 ? (
              <NoAvailability description={`${businessName} no tiene horarios disponibles en las próximas semanas. Intenta más adelante o elige otro servicio.`} />
            ) : !weekHasSlots && nearest ? (
              <NoAvailability
                description={`${businessName} todavía no ha habilitado horarios para estas fechas. Puedes ${earlier ? 'volver al periodo anterior' : 'avanzar al siguiente periodo'} para consultar los cupos disponibles.`}
                actionText={`Ver disponibilidad de ${fmt(nearest, { month: 'long' })}`}
                onAction={() => setWeekStart(sundayOf(nearest))}
              />
            ) : (
              <>
                <div className="px-5 py-4 border-b border-[#ecefe9]">
                  <p className="text-[#66716c] text-[11px] font-semibold tracking-[0.88px] uppercase mb-3">Fechas con disponibilidad</p>
                  <div className="grid grid-cols-7 gap-2">
                    {week.map((day) => {
                      const enabled = slotsByDate.has(day);
                      const selected = day === date;
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={!enabled}
                          aria-pressed={selected}
                          aria-label={`${longDate(day)}${enabled ? '' : ', sin disponibilidad'}`}
                          onClick={() => {
                            setDate(day);
                            setSlot('');
                            setMissing(false);
                          }}
                          className={`rounded-[8px] py-2 flex flex-col items-center gap-0.5 border transition-colors
                            ${selected
                              ? 'bg-[#005146] border-[#005146] text-white'
                              : enabled
                              ? 'bg-white border-[#d4d9d3] text-[#18211e] hover:border-[#005146] cursor-pointer'
                              : 'bg-[#ecefe9] border-[#ecefe9] text-[#b5bbb6] cursor-not-allowed'}`}
                        >
                          <span className="text-[10px] font-semibold uppercase">{fmt(day, { weekday: 'short' }).replace('.', '')}</span>
                          <span className="text-[16px] font-bold leading-tight">{Number(day.slice(8))}</span>
                          <span className={`text-[8px] h-2.5 leading-none ${selected ? 'text-white' : 'text-[#005146]'}`}>
                            {selected ? 'Seleccionado' : enabled ? '●' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 text-[11px] text-[#66716c]">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#005146]" />Con horarios</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#c4c9c4]" />Sin disponibilidad</span>
                  </div>
                </div>

                <div className="px-5 py-4 flex flex-col gap-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[#66716c] text-[11px] font-semibold tracking-[0.88px] uppercase">
                        {date ? fmt(date, { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sin fecha seleccionada'}
                      </p>
                      <h3 className="text-[#18211e] text-[15px] font-semibold">Horarios disponibles</h3>
                    </div>
                    <span className="text-[#66716c] text-[11px]">Zona horaria de Bogotá</span>
                  </div>
                  {slots.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={s === slot}
                          onClick={() => {
                            setSlot(s);
                            setMissing(false);
                          }}
                          className={`rounded-[8px] border py-2.5 text-[14px] font-semibold transition-colors cursor-pointer
                            ${s === slot
                              ? 'bg-[#e6f0ef] border-[#005146] text-[#005146]'
                              : 'bg-white border-[#d4d9d3] text-[#18211e] hover:border-[#005146]'}`}
                        >
                          {hhmm(s)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#66716c] text-[13px]">Selecciona una fecha con disponibilidad para ver sus horarios.</p>
                  )}
                  <p className="flex gap-2 rounded-[8px] bg-[#f2f3ee] px-4 py-3 text-[12px] text-[#66716c]">
                    <span aria-hidden="true">ⓘ</span>
                    Los horarios mostrados contemplan los {service?.durationMinutes ?? availability.durationMinutes} min del servicio y la
                    disponibilidad de {businessName}. Los espacios bloqueados u ocupados se excluyen automáticamente.
                  </p>
                </div>
              </>
            )}
          </section>

          <aside className={`${card} p-4 md:col-start-2 md:row-start-2 md:sticky md:top-24`}>
            <h2 className="text-[#18211e] text-[14px] font-semibold pb-3 border-b border-[#ecefe9]">Resumen de reserva</h2>
            <SummaryRows
              rows={[
                ['Servicio', service?.name ?? 'Por seleccionar'],
                ['Proveedor', businessName],
                ['Duración', service ? `${service.durationMinutes} min` : '—'],
                ['Fecha', date ? capitalize(fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })) : 'Por seleccionar'],
                ['Hora', slot ? hhmm(slot) : 'Por seleccionar'],
              ]}
            />
            <div className="flex justify-between items-center border-t border-[#ecefe9] pt-3 mt-1">
              <span className="text-[#18211e] text-[13px] font-semibold">Precio total</span>
              <span className="text-[#005146] text-[17px] font-bold">{service ? cop(service.price) : '—'}</span>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              disabled={busy}
              aria-disabled={!slot}
              className={`${primaryButton} w-full mt-4 ${slot ? '' : 'opacity-50'}`}
            >
              {busy ? 'Reservando...' : 'Continuar'}
            </button>
            {missing && (
              <p role="alert" className="text-[#d94f41] text-[12px] mt-2">
                Selecciona un servicio, una fecha y una hora para continuar.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
