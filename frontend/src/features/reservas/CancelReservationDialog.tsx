import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/client';
import { ReservationResponse, cancelReservation } from '@/api/reservations';
import { dayKey, hhmm, longDate } from '@/utils/dates';

/** HU 3.3.1: pide confirmación explícita antes de liberar el horario. */
export default function CancelReservationDialog({
  reservation,
  onClose,
  onCancelled,
}: {
  reservation: ReservationResponse;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // Same as IniciarReservaModal: the first handlers stay valid while the dialog is open.
  }, []);

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await cancelReservation(reservation.id);
      onCancelled();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cancelar la reserva. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#18211e]/40 animate-modal-backdrop" onClick={() => !saving && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-reserva-titulo"
        className="relative w-full max-w-[400px] bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-5 shadow-2xl animate-modal-pop"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">
              {reservation.businessName}
            </p>
            <h2 id="cancelar-reserva-titulo" className="text-[#18211e] text-[20px] font-bold leading-tight mt-0.5">
              ¿Cancelar esta cita?
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
            className="w-8 h-8 shrink-0 rounded-full border border-[#d4d9d3] text-[#66716c] hover:text-[#18211e] hover:bg-[#f2f3ee] flex items-center justify-center cursor-pointer bg-transparent disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 bg-[#f2f3ee] border border-[#d4d9d3] rounded-[10px] px-4 py-3">
          <p className="text-[#18211e] text-[14px] font-semibold">{reservation.serviceName}</p>
          <p className="text-[#66716c] text-[12px] mt-0.5">
            {longDate(dayKey(reservation.startAt))} · {hhmm(reservation.startAt)} – {hhmm(reservation.endAt)}
          </p>
        </div>

        <p className="text-[#66716c] text-[13px] mt-3">
          El horario quedará libre para otros clientes. Esta acción no se puede deshacer.
        </p>

        {error && (
          <p role="alert" className="text-[#d94f41] text-[13px] mt-3">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[14px] px-4 py-[10px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving}
            className="bg-[#d94f41] hover:bg-[#b64135] text-white font-semibold text-[14px] px-4 py-[10px] rounded-[8px] transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Cancelando...' : 'Sí, cancelar cita'}
          </button>
        </div>
      </div>
    </div>
  );
}
