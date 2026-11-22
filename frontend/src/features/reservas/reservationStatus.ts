import { ReservationStatus } from '@/api/reservations';

export interface StatusMeta {
  label: string;
  /** Clases tailwind de la píldora del badge. */
  tone: string;
}

// Un estado nuevo del backend sin entrada aquí cae en UNKNOWN_STATUS en vez de mostrar una píldora sin estilo.
export const UNKNOWN_STATUS: StatusMeta = {
  label: 'Desconocida',
  tone: 'bg-[#ecefe9] text-[#66716c] border-[#d4d9d3]',
};

export const STATUS_META: Record<ReservationStatus, StatusMeta> = {
  PENDIENTE: { label: 'Pendiente', tone: 'bg-[#fdf6e3] text-[#8a6d1a] border-[#ecd9a0]' },
  CONFIRMADA: { label: 'Confirmada', tone: 'bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]' },
  CANCELADA: { label: 'Cancelada', tone: 'bg-[#fdf1f0] text-[#d94f41] border-[#f2bfbb]' },
  ATENDIDA: { label: 'Atendida', tone: 'bg-[#e6f0ef] text-[#005146] border-[#b8d4d1]' },
  NO_ASISTIO: { label: 'No asistió', tone: 'bg-[#fff6e8] text-[#94611c] border-[#ead2a8]' },
};

/** El badge muestra siempre uno de los cinco estados reales, sin inventar etiquetas por fecha. */
export function statusMeta(status: ReservationStatus): StatusMeta {
  return STATUS_META[status] ?? UNKNOWN_STATUS;
}

export const STATUS_FILTERS: (ReservationStatus | '')[] = ['', 'PENDIENTE', 'CONFIRMADA', 'CANCELADA'];
