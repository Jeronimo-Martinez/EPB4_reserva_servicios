import { request } from '@/api/client';

export type NotificationType =
  | 'NUEVA_RESERVA'
  | 'REPROGRAMACION'
  | 'CANCELACION_PROVEEDOR'
  | 'CANCELACION_CLIENTE'
  | 'RECORDATORIO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Datos de la reserva, p. ej. "Miércoles, 23 de julio · 10:00". */
  detail: string | null;
  read: boolean;
  createdAt: string;
}

/** HU-24: las 50 más recientes del usuario con sesión, la más nueva primero. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  return request<AppNotification[]>('/api/v1/notifications');
}

export async function markNotificationRead(id: string): Promise<void> {
  await request<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' });
}
