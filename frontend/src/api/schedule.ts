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

export async function fetchBusinessHours(providerEmail: string): Promise<BusinessHoursResponse> {
  return request<BusinessHoursResponse>(
    `/api/v1/schedule/hours?providerEmail=${encodeURIComponent(providerEmail)}`
  );
}

export async function saveBusinessHours(
  providerEmail: string,
  days: DayHours[]
): Promise<BusinessHoursResponse> {
  return request<BusinessHoursResponse>('/api/v1/schedule/hours', {
    method: 'PUT',
    body: JSON.stringify({ providerEmail, days }),
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
  status: 'CONFIRMADA' | 'PENDIENTE';
}

export interface AgendaDay {
  date: string;
  /** null cuando el negocio no atiende ese día. */
  openTime: string | null;
  closeTime: string | null;
  reservations: AgendaEntry[];
}

export interface AgendaResponse {
  view: AgendaView;
  from: string;
  to: string;
  timeZone: string;
  message: string | null;
  days: AgendaDay[];
}

export async function fetchAgenda(
  providerEmail: string,
  view: AgendaView,
  date: string
): Promise<AgendaResponse> {
  const params = new URLSearchParams({ providerEmail, view, date });
  return request<AgendaResponse>(`/api/v1/schedule/agenda?${params}`);
}
