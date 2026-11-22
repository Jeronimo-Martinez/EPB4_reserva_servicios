import { request } from '@/api/client';
import type { AvailabilityResponse } from '@/api/services';

// ATENDIDA y NO_ASISTIO (HU-22) los asigna la HU de registro de asistencia.
export type ReservationStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'ATENDIDA' | 'NO_ASISTIO';

export interface ReservationResponse {
  message: string | null;
  id: string;
  status: ReservationStatus;
  businessName: string;
  serviceName: string;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  totalPrice: number;
  currency: string;
  /** Solo mientras la reserva es un bloqueo temporal (PENDIENTE). */
  holdExpiresAt: string | null;
  serviceId: string;
  /** Solo en reservas CANCELADA: quién la canceló y el motivo opcional. */
  cancelledBy: 'CLIENTE' | 'PROVEEDOR' | null;
  cancellationReason: string | null;
}

/** Reservas del cliente con sesión (el backend lo identifica por el token), por fecha ascendente. */
export async function fetchMyReservations(status?: ReservationStatus): Promise<ReservationResponse[]> {
  const qs = status ? `?status=${status}` : '';
  return request<ReservationResponse[]>(`/api/v1/reservations${qs}`);
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

/** Libera el horario de una reserva pendiente o confirmada. 409 si ya pasó o ya no se puede cancelar. */
export async function cancelReservation(id: string): Promise<ReservationResponse> {
  return request<ReservationResponse>(`/api/v1/reservations/${id}/cancel`, { method: 'POST' });
}

// ─── HU-19 Reprogramación de reserva ───

/** Horario anterior y nuevo; `newStartAt`/`newEndAt` son null cuando se cancela la reprogramación. */
export interface RescheduleResponse {
  message: string;
  reservationId: string;
  status: ReservationResponse['status'];
  businessName: string;
  serviceName: string;
  durationMinutes: number;
  previousStartAt: string;
  previousEndAt: string;
  newStartAt: string | null;
  newEndAt: string | null;
  /** Solo mientras el nuevo horario espera confirmación. */
  holdExpiresAt: string | null;
}

/** Solo horarios realmente libres del proveedor. 409 si la reserva ya pasó, fue cancelada o no está confirmada. */
export async function fetchRescheduleAvailability(id: string, from: string, to: string): Promise<AvailabilityResponse> {
  return request<AvailabilityResponse>(`/api/v1/reservations/${id}/reschedule/availability?from=${from}&to=${to}`);
}

/** Bloquea temporalmente el nuevo horario (la reserva aún no cambia) y devuelve el resumen del cambio. */
export async function holdReschedule(id: string, startAt: string): Promise<RescheduleResponse> {
  return request<RescheduleResponse>(`/api/v1/reservations/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ startAt }),
  });
}

/** Aplica el cambio: libera el horario anterior, ocupa el nuevo y notifica al proveedor. 410 si el bloqueo expiró. */
export async function confirmReschedule(id: string): Promise<RescheduleResponse> {
  return request<RescheduleResponse>(`/api/v1/reservations/${id}/reschedule/confirm`, { method: 'POST' });
}

/** Descarta el cambio pendiente: la reserva conserva su horario y el elegido vuelve a quedar libre. */
export async function cancelReschedule(id: string): Promise<RescheduleResponse> {
  return request<RescheduleResponse>(`/api/v1/reservations/${id}/reschedule`, { method: 'DELETE' });
}
