import { ReservationStatus } from '@/api/reservations';
import { STATUS_FILTERS, STATUS_META } from './reservationStatus';

export function StatusFilterChips({
  value,
  onChange,
}: {
  value: ReservationStatus | '';
  onChange: (status: ReservationStatus | '') => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filtrar por estado">
      {STATUS_FILTERS.map((status) => {
        const active = value === status;
        return (
          <button
            key={status || 'todas'}
            type="button"
            onClick={() => onChange(status)}
            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all cursor-pointer border
              ${
                active
                  ? 'bg-[#005146] text-white border-[#005146] shadow-xs'
                  : 'bg-white text-[#66716c] border-[#d4d9d3] hover:border-[#005146] hover:text-[#18211e]'
              }`}
          >
            {status === '' ? 'Todas' : STATUS_META[status].label}
          </button>
        );
      })}
    </div>
  );
}
