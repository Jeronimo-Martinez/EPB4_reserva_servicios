import { useEffect, useState } from 'react';
import { NavBar } from '@/components/layout';
import { EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { AppNotification, NotificationType, fetchNotifications, markNotificationRead } from '@/api/notifications';

const GREEN = 'bg-[#e6f0ef] text-[#005146]';
const ORANGE = 'bg-[#fdf3e7] text-[#b86e12]';
const RED = 'bg-[#fdf1f0] text-[#d94f41]';

const KINDS: Record<NotificationType, { label: string; tone: string }> = {
  RECORDATORIO: { label: 'Recordatorio de cita', tone: GREEN },
  NUEVA_RESERVA: { label: 'Nueva reserva', tone: GREEN },
  REPROGRAMACION: { label: 'Reprogramación', tone: ORANGE },
  CANCELACION_PROVEEDOR: { label: 'Cancelación del proveedor', tone: RED },
  CANCELACION_CLIENTE: { label: 'Cancelación del cliente', tone: RED },
};

const bellIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** HU-24: the user's inbox; opening an unread notification marks it as read. */
export default function Notificaciones() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'No pudimos cargar tus notificaciones.'));
  }, []);

  const setRead = (id: string, read: boolean) =>
    setItems((list) => list?.map((n) => (n.id === id ? { ...n, read } : n)) ?? null);

  const open = (n: AppNotification) => {
    if (n.read) return;
    setRead(n.id, true);
    markNotificationRead(n.id).catch(() => setRead(n.id, false));
  };

  const unread = items?.filter((n) => !n.read).length ?? 0;
  const audience = user?.role === 'PROVEEDOR' ? 'proveedor' : 'cliente';

  return (
    <div className="bg-[#f2f3ee] min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-[920px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div>
          <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">Notificaciones de reservas</p>
          <h1 className="text-[26px] md:text-[30px] font-bold text-[#18211e] tracking-tight mt-1">Notificaciones</h1>
          <p className="text-[#66716c] text-[14px] mt-1">Novedades importantes sobre reservas y próximas citas.</p>
        </div>

        {error ? (
          <p role="alert" className="rounded-[10px] bg-[#fdf1f0] border border-[#f3c4be] px-5 py-4 text-[14px] text-[#b23b2e]">{error}</p>
        ) : !items ? (
          <div className="text-center py-20" role="status">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-[#005146] border-t-transparent rounded-full" />
            <p className="mt-3 text-[#66716c] text-[14px]">Cargando notificaciones...</p>
          </div>
        ) : (
          <section className="bg-[#fcfcf8] border border-[#d4d9d3] rounded-[12px] shadow-xs overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#ecefe9]">
              <div>
                <h2 className="text-[#18211e] text-[16px] font-semibold">Bandeja de {audience}</h2>
                <p className="text-[#66716c] text-[12px] mt-0.5" aria-live="polite">
                  {unread ? `${unread} ${unread === 1 ? 'notificación' : 'notificaciones'} sin leer` : 'No tienes notificaciones sin leer'}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#005146] bg-[#e6f0ef] px-2.5 py-1 rounded-full">
                Destinatario: {audience}
              </span>
            </header>

            {items.length === 0 ? (
              <EmptyState
                variant="simple"
                title="Aún no tienes notificaciones"
                description="Aquí verás confirmaciones, cambios, cancelaciones y recordatorios de tus reservas."
              />
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id} className="border-b border-[#ecefe9] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={`w-full text-left flex gap-4 px-5 py-4 transition-colors cursor-pointer
                        ${n.read ? 'bg-[#fcfcf8] hover:bg-[#f6f7f3]' : 'bg-[#f3f6f2] hover:bg-[#ecf1ec]'}`}
                    >
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${KINDS[n.type].tone}`}>
                        {bellIcon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">{KINDS[n.type].label}</span>
                        <span className="block text-[#18211e] text-[16px] font-semibold mt-1">{n.title}</span>
                        <span className="block text-[#66716c] text-[14px] mt-0.5">{n.body}</span>
                        {n.detail && <span className="block text-[#18211e] text-[12px] mt-2">{n.detail}</span>}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#005146] mt-2 shrink-0">
                          <span className="sr-only">Sin leer</span>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="text-[#66716c] text-[12px]">Selecciona una notificación para marcarla como leída.</p>
      </main>
    </div>
  );
}
