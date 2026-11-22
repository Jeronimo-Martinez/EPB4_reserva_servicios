import { useEffect, useState } from 'react';
import { NavBar } from '@/components/layout';
import ProviderAside from '@/components/layout/ProviderAside';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { HistoryStatus, ReservationHistoryResponse, fetchReservationHistory } from '@/api/schedule';
import { statusMeta } from '@/features/reservas/reservationStatus';
import { dayKey, fmt, hhmm } from '@/utils/dates';

/** HU-22 Consulta de historial de reservas (proveedor). */
const FILTERS: { value: HistoryStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'ATENDIDA', label: 'Atendida' },
  { value: 'NO_ASISTIO', label: 'No asistió' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const shortDate = (instant: string) =>
  fmt(dayKey(instant), { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

function StatusBadge({ status }: { status: HistoryStatus }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center border rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${meta.tone}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function EmptyHistory({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <div role="status" className="border border-dashed border-[#c4c9c4] rounded-[12px] bg-[#fcfcf8] px-6 py-14 flex flex-col items-center text-center gap-2">
      <div className="w-12 h-12 rounded-full bg-[#ecefe9] text-[#66716c] flex items-center justify-center mb-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-[#18211e] text-[18px] font-bold">
        {filtered ? 'No hay reservas con ese estado' : 'Aún no hay reservas en el historial'}
      </h2>
      <p className="text-[#66716c] text-[13px] max-w-[380px]">
        {filtered
          ? 'Prueba con otro filtro o vuelve a ver todas las reservas de tu negocio.'
          : 'Las reservas confirmadas, atendidas, no asistidas o canceladas aparecerán aquí.'}
      </p>
      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="mt-3 border border-[#005146] text-[#005146] hover:bg-[#e6f0ef] font-semibold text-[13px] px-5 py-2.5 rounded-[8px] transition-colors cursor-pointer bg-white"
        >
          Volver al historial
        </button>
      )}
    </div>
  );
}

export default function HistorialReservas() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<HistoryStatus | ''>('');
  const [history, setHistory] = useState<ReservationHistoryResponse | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let current = true;
    setHistory(null);
    setError('');
    fetchReservationHistory(filter || undefined)
      .then((res) => current && setHistory(res))
      .catch((err: unknown) => current && setError(err instanceof ApiError ? err.message : 'Intenta de nuevo.'));
    return () => {
      current = false;
    };
  }, [filter, reloadKey]);

  const businessName = user?.businessName || 'tu negocio';
  const rows = history?.reservations ?? [];

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col md:flex-row gap-8">
        <ProviderAside active="Reservas Recibidas" />
        <section className="flex-1 min-w-0 flex flex-col gap-5">
          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">Historial de reservas</p>
            <h1 className="text-[#18211e] text-[28px] font-bold leading-tight mt-1">Historial de reservas</h1>
            <p className="text-[#66716c] text-[14px] mt-1">Consulta el registro de actividad de {businessName}.</p>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
            {FILTERS.map(({ value, label }) => {
              const selected = value === filter;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(value)}
                  className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer
                    ${selected ? 'bg-[#005146] border-[#005146] text-white' : 'bg-white border-[#d4d9d3] text-[#18211e] hover:border-[#005146]'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {error ? (
            <div role="alert" className="rounded-[10px] bg-[#fdf1f0] border border-[#f3c4be] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[#b23b2e] text-[14px]">No pudimos cargar el historial: {error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="text-[#005146] text-[13px] font-semibold underline bg-transparent cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : !history ? (
            <div className="text-center py-16" role="status">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
              <p className="mt-3 text-[#66716c] text-[14px]">Cargando historial...</p>
            </div>
          ) : rows.length === 0 ? (
            <EmptyHistory filtered={!!filter} onReset={() => setFilter('')} />
          ) : (
            <div className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs overflow-hidden">
              {/* Escritorio: tabla como el mockup. */}
              <table className="hidden md:table w-full text-left">
                <thead className="border-b border-[#d4d9d3]">
                  <tr className="text-[#66716c] text-[11px] font-semibold tracking-[0.88px] uppercase">
                    <th scope="col" className="px-5 py-4 font-semibold">Fecha</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Hora</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Cliente</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Servicio</th>
                    <th scope="col" className="px-5 py-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[#ecefe9] last:border-b-0">
                      <td className="px-5 py-4">
                        <p className="text-[#18211e] text-[14px]">{shortDate(r.startAt)}</p>
                        <p className="text-[#66716c] text-[11px]">{r.code}</p>
                      </td>
                      <td className="px-5 py-4 text-[#18211e] text-[14px]">{hhmm(r.startAt)}</td>
                      <td className="px-5 py-4 text-[#18211e] text-[14px] font-medium">{r.clientName}</td>
                      <td className="px-5 py-4 text-[#66716c] text-[14px]">{r.serviceName}</td>
                      <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Móvil: mismas columnas en tarjetas, sin scroll horizontal. */}
              <ul className="md:hidden divide-y divide-[#ecefe9]">
                {rows.map((r) => (
                  <li key={r.id} className="px-4 py-4 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[#18211e] text-[15px] font-semibold">{r.clientName}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-[#66716c] text-[13px]">{r.serviceName}</p>
                    <p className="text-[#18211e] text-[13px]">
                      {shortDate(r.startAt)} · {hhmm(r.startAt)} <span className="text-[#66716c]">· {r.code}</span>
                    </p>
                  </li>
                ))}
              </ul>

              <p className="border-t border-[#d4d9d3] px-5 py-3 text-[#66716c] text-[12px]">
                Mostrando {rows.length} de {history.total} {history.total === 1 ? 'reserva' : 'reservas'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
