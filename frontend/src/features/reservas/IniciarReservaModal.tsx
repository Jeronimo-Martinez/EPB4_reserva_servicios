import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types/service';
import { cop } from '@/utils/dates';

/** Confirms the chosen service before opening the date and time selection. */
export default function IniciarReservaModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const { startBooking } = useAuth();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // onClose only clears the selection, so the first one stays valid; re-running would steal focus.
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#18211e]/40 animate-modal-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="iniciar-reserva-titulo"
        className="relative w-full max-w-[380px] bg-[#fcfcf8] border border-[#d4d9d3] rounded-[14px] p-5 shadow-2xl animate-modal-pop"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[#005146] text-[11px] font-semibold tracking-[0.88px] uppercase">{service.businessName}</p>
            <h2 id="iniciar-reserva-titulo" className="text-[#18211e] text-[20px] font-bold leading-tight mt-0.5">
              Inicia tu reserva
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 shrink-0 rounded-full border border-[#d4d9d3] text-[#66716c] hover:text-[#18211e] hover:bg-[#f2f3ee] flex items-center justify-center cursor-pointer bg-transparent"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 bg-[#f2f3ee] border border-[#d4d9d3] rounded-[10px] px-4 py-3 flex justify-between gap-3">
          <div>
            <p className="text-[#18211e] text-[14px] font-semibold">{service.name}</p>
            <p className="text-[#66716c] text-[12px] mt-0.5">{service.durationMinutes} min</p>
          </div>
          <p className="text-[#18211e] text-[14px] font-semibold">{cop(service.price)}</p>
        </div>

        <p className="text-[#66716c] text-[13px] mt-3">
          El servicio está seleccionado. Continúa para elegir una fecha y hora disponible.
        </p>

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#d4d9d3] bg-white hover:bg-[#f2f3ee] text-[#18211e] font-semibold text-[14px] px-4 py-[10px] rounded-[8px] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => startBooking(service)}
            className="bg-[#005146] hover:bg-[#00403b] text-white font-semibold text-[14px] px-4 py-[10px] rounded-[8px] transition-colors cursor-pointer"
          >
            Elegir fecha y hora
          </button>
        </div>
      </div>
    </div>
  );
}
