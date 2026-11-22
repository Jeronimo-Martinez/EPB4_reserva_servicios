import { request } from '@/api/client';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface DayHours {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface BusinessHoursResponse {
  message: string | null;
  timeZone: string;
  days: DayHours[];
}

export async function fetchBusinessHours(): Promise<BusinessHoursResponse> {
  return request<BusinessHoursResponse>('/api/v1/schedule/hours');
}

export async function saveBusinessHours(days: DayHours[]): Promise<BusinessHoursResponse> {
  return request<BusinessHoursResponse>('/api/v1/schedule/hours', {
    method: 'PUT',
    body: JSON.stringify({ days }),
  });
}

export type AgendaView = 'DIA' | 'SEMANA' | 'MES';

export interface AgendaEntry {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  /** CONFIRMADA = reserva; PENDIENTE = bloqueo temporal mientras un cliente completa su reserva. */
  status: 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA';
}

/** Periodo bloqueado por el proveedor (HU-10), recortado al horario de atención de ese día. */
export interface AgendaBlock {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
}

export interface AgendaDay {
  date: string;
  /** null cuando el negocio no atiende ese día. */
  openTime: string | null;
  closeTime: string | null;
  reservations: AgendaEntry[];
  blocks: AgendaBlock[];
}

export interface AgendaResponse {
  view: AgendaView;
  from: string;
  to: string;
  timeZone: string;
  message: string | null;
  days: AgendaDay[];
}

export async function fetchAgenda(view: AgendaView, date: string): Promise<AgendaResponse> {
  const params = new URLSearchParams({ view, date });
  return request<AgendaResponse>(`/api/v1/schedule/agenda?${params}`);
}

export interface BlockRequest {
  startDate: string;
  endDate: string;
  /** Sin horas se bloquean los días completos. */
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  /** true cuando el proveedor ya aceptó la advertencia de reservas afectadas. */
  confirmConflicts: boolean;
}

/** HU-10. 428 = el periodo incluye reservas (mostrar la advertencia y reenviar con confirmConflicts); 409 = ya estaba bloqueado. */
export async function createBlock(block: BlockRequest): Promise<AgendaBlock> {
  return request<AgendaBlock>('/api/v1/schedule/blocks', { method: 'POST', body: JSON.stringify(block) });
}

/** HU-20. El motivo es opcional y se envía al cliente. */
export async function cancelReservationByProvider(id: string, reason: string): Promise<AgendaEntry> {
  return request<AgendaEntry>(`/api/v1/schedule/reservations/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() || null }),
  });
}

// ─── HU-22 Historial de reservas (proveedor) ───

/** Estados que puede tener una reserva del historial; ATENDIDA y NO_ASISTIO los asigna la HU de asistencia. */
export type HistoryStatus = 'CONFIRMADA' | 'ATENDIDA' | 'NO_ASISTIO' | 'CANCELADA';

export interface ReservationHistoryItem {
  id: string;
  /** Código corto para mostrar, p. ej. "R-1A2B". */
  code: string;
  startAt: string;
  endAt: string;
  clientName: string;
  serviceName: string;
  durationMinutes: number;
  status: HistoryStatus;
}

export interface ReservationHistoryResponse {
  status: HistoryStatus | null;
  /** Solo cuando la lista está vacía. */
  message: string | null;
  total: number;
  reservations: ReservationHistoryItem[];
}

/** Reservas del negocio con sesión, de la más reciente a la más antigua; `status` filtra por estado. */
export async function fetchReservationHistory(status?: HistoryStatus): Promise<ReservationHistoryResponse> {
  const qs = status ? `?status=${status}` : '';
  return request<ReservationHistoryResponse>(`/api/v1/schedule/history${qs}`);
}
