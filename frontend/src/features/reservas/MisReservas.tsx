import { useEffect, useState } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { ReservationResponse, fetchMyReservations } from '@/api/reservations';
import { cop, dayKey, fmt, hhmm, longDate } from '@/utils/dates';

const calendarIcon = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

function ReservationCard({ reservation, past }: { reservation: ReservationResponse; past: boolean }) {
  const day = dayKey(reservation.startAt);
  const tone = past ? 'bg-[#ecefe9] text-[#66716c] border-[#d4d9d3]' : 'bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]';
  return (
    <li className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs p-4 sm:p-5 flex gap-4 items-start">
      <div className={`w-14 shrink-0 rounded-[10px] border py-2 text-center ${tone}`} aria-hidden="true">
        <span className="block text-[11px] font-semibold uppercase">{fmt(day, { month: 'short' }).replace('.', '')}</span>
        <span className="block text-[22px] font-bold leading-tight">{Number(day.slice(8))}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-[#18211e] text-[16px] font-bold leading-snug">{reservation.serviceName}</h3>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tone}`}>
            {past ? 'Finalizada' : 'Confirmada'}
          </span>
        </div>
        <p className="text-[#66716c] text-[13px] mt-0.5">{reservation.businessName}</p>
        <p className="text-[#18211e] text-[13px] mt-2">
          {longDate(day)} · {hhmm(reservation.startAt)} – {hhmm(reservation.endAt)}
        </p>
        <p className="text-[#66716c] text-[13px] mt-1">
          {reservation.durationMinutes} min · <span className="text-[#005146] font-semibold">{cop(reservation.totalPrice)}</span>
        </p>
      </div>
    </li>
  );
}

function Section({ title, reservations, past }: { title: string; reservations: ReservationResponse[]; past: boolean }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[#18211e] text-[18px] font-bold">
        {title} <span className="text-[#66716c] font-normal text-[14px]">({reservations.length})</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {reservations.map((r) => (
          <ReservationCard key={r.id} reservation={r} past={past} />
        ))}
      </ul>
    </section>
  );
}

export default function MisReservas() {
  const { navigate } = useAuth();
  const [reservations, setReservations] = useState<ReservationResponse[] | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let current = true;
    setError('');
    setReservations(null);
    fetchMyReservations()
      .then((data) => current && setReservations(data))
      .catch((err: unknown) => current && setError(err instanceof ApiError ? err.message : 'Intenta de nuevo.'));
    return () => {
      current = false;
    };
  }, [reloadKey]);

  // A reservation in progress still counts as upcoming until it ends.
  const now = Date.now();
  const upcoming = reservations?.filter((r) => new Date(r.endAt).getTime() > now) ?? [];
  const past = reservations?.filter((r) => new Date(r.endAt).getTime() <= now).reverse() ?? [];

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-[880px] w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <span className="inline-block bg-[#e6f0ef] text-[#005146] text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
              Tus Citas
            </span>
            <h1 className="text-[26px] md:text-[30px] font-bold text-[#18211e] tracking-tight">Mis Reservas</h1>
            <p className="text-[#66716c] text-[14px] mt-1">Consulta los detalles de tus reservas confirmadas.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('catalogo')}
            className="inline-flex items-center gap-2 bg-[#005146] hover:bg-[#00403b] text-white font-medium px-4 py-2 rounded-[8px] transition-colors text-[14px] cursor-pointer shadow-xs w-fit"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Explorar catálogo
          </button>
        </div>

        {error ? (
          <EmptyState
            title="No pudimos cargar tus reservas"
            description={error}
            actionText="Reintentar"
            onAction={() => setReloadKey((k) => k + 1)}
          />
        ) : !reservations ? (
          <div className="text-center py-20" role="status">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
            <p className="mt-3 text-[#66716c] text-[14px]">Cargando tus reservas...</p>
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={calendarIcon}
            title="Aún no tienes citas agendadas"
            description="Explora nuestro catálogo para descubrir profesionales calificados y agendar tu primera cita cuando lo necesites."
            actionText="Explorar catálogo de servicios"
            onAction={() => navigate('catalogo')}
          />
        ) : (
          <>
            {upcoming.length ? (
              <Section title="Próximas citas" reservations={upcoming} past={false} />
            ) : (
              <EmptyState
                variant="dashed"
                icon={calendarIcon}
                title="No tienes citas próximas"
                description="Tus citas anteriores aparecen abajo. Agenda una nueva cuando lo necesites."
                actionText="Explorar catálogo de servicios"
                onAction={() => navigate('catalogo')}
              />
            )}
            {past.length > 0 && <Section title="Citas pasadas" reservations={past} past />}
          </>
        )}
      </main>
    </div>
  );
}
