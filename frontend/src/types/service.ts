export interface Service {
  id: string;
  businessId?: string;
  businessName?: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  isAvailable: boolean;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
}

export interface ServiceBookingRequest {
  serviceId: string;
  serviceName: string;
  clientEmail: string;
  clientName: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export type ServiceCategory =
  | 'Todas'
  | 'Belleza y Estética'
  | 'Salud y Bienestar'
  | 'Entrenamiento Físico'
  | 'Reparaciones del Hogar'
  | 'Educación y Tutorías'
  | 'Fotografía y Video'
  | 'Limpieza y Mantenimiento'
  | 'Tecnología y TI'
  | 'Consultoría Profesional';
