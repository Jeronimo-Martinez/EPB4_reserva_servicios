export type ReservationStatus = 'PENDIENTE' | 'ATENDIDA' | 'NO_ASISTIDA' | 'CANCELADA';

export interface BusinessDayHours {
  id: string;
  nombre: string;
  corto: string;
  activo: boolean;
  inicio: string;
  cierre: string;
}

export interface ScheduleBlockout {
  id: string;
  fecha: string; // YYYY-MM-DD
  fechaFin?: string; // YYYY-MM-DD para rango
  horaInicio?: string; // HH:mm
  horaFin?: string; // HH:mm
  motivo: string;
}

export interface AppReservation {
  id: string;
  serviceId: string;
  serviceName: string;
  businessId: string;
  businessName: string;
  businessLocation: string;
  businessPhone?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  durationMinutes: number;
  price: number;
  status: ReservationStatus;
  cancelledBy?: 'CLIENTE' | 'PROVEEDOR';
  cancellationReason?: string;
  rescheduledFrom?: { date: string; timeSlot: string };
  createdAt: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'new_booking' | 'rescheduled' | 'cancelled' | 'info';
  timestamp: string;
  read: boolean;
  targetRole?: 'CLIENTE' | 'PROVEEDOR';
}

export interface BusinessInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
}
