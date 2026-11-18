import { request } from '@/api/client';

export interface ReservationResponse {
  message: string | null;
  id: string;
  status: 'PENDIENTE' | 'CONFIRMADA';
  businessName: string;
  serviceName: string;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  totalPrice: number;
  currency: string;
  /** Solo mientras la reserva es un bloqueo temporal (PENDIENTE). */
  holdExpiresAt: string | null;
}

/** Reservas confirmadas del cliente con sesión (el backend lo identifica por el token), por fecha ascendente. */
export async function fetchMyReservations(): Promise<ReservationResponse[]> {
  return request<ReservationResponse[]>('/api/v1/reservations');
}

/** Bloquea el horario por unos minutos mientras el cliente revisa y confirma. 409 si otro cliente ya lo tomó. */
export async function createHold(serviceId: string, startAt: string): Promise<ReservationResponse> {
  return request<ReservationResponse>('/api/v1/reservations/holds', {
    method: 'POST',
    body: JSON.stringify({ serviceId, startAt }),
  });
}

/** Convierte el bloqueo en reserva. 410 si el bloqueo ya expiró. */
export async function confirmReservation(id: string): Promise<ReservationResponse> {
  return request<ReservationResponse>(`/api/v1/reservations/${id}/confirm`, { method: 'POST' });
}
