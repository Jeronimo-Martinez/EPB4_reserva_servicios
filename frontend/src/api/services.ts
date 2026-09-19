import { Service, ServiceBookingRequest } from '@/types/service';

const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    businessName: 'Centro Vital Salud y Bienestar',
    name: 'Masaje Terapéutico Descontracturante',
    category: 'Salud y Bienestar',
    description: 'Sesión integral enfocada en aliviar tensión en espalda, cuello y hombros mediante técnicas combinadas.',
    durationMinutes: 60,
    price: 45.0,
    isAvailable: true,
    rating: 4.9,
    reviewsCount: 38,
  },
  {
    id: 'srv-2',
    businessName: 'Centro Vital Salud y Bienestar',
    name: 'Terapia de Relajación y Aromaterapia',
    category: 'Salud y Bienestar',
    description: 'Masaje suave con aceites esenciales naturales para reducir el estrés y promover el descanso profundo.',
    durationMinutes: 90,
    price: 65.0,
    isAvailable: true,
    rating: 4.8,
    reviewsCount: 24,
  },
  {
    id: 'srv-3',
    businessName: 'Estudio Bella Barber & Hair',
    name: 'Corte de Cabello y Estilo Personalizado',
    category: 'Belleza y Estética',
    description: 'Corte moderno o clásico según tu fisionomía, incluye lavado revitalizante y acabado con producto premium.',
    durationMinutes: 45,
    price: 25.0,
    isAvailable: true,
    rating: 4.9,
    reviewsCount: 52,
  },
  {
    id: 'srv-4',
    businessName: 'FitPro Training Studio',
    name: 'Entrenamiento Funcional Personalizado',
    category: 'Entrenamiento Físico',
    description: 'Rutina individual guiada para acondicionamiento físico, fuerza y movilidad con evaluación inicial.',
    durationMinutes: 60,
    price: 35.0,
    isAvailable: true,
    rating: 5.0,
    reviewsCount: 19,
  },
  {
    id: 'srv-5',
    businessName: 'Soluciones Hogar Exprés',
    name: 'Diagnóstico y Reparación de Plomería',
    category: 'Reparaciones del Hogar',
    description: 'Inspección técnica, reparación de fugas de agua, sustitución de grifería y destape preventivo.',
    durationMinutes: 60,
    price: 40.0,
    isAvailable: true,
    rating: 4.7,
    reviewsCount: 31,
  },
  {
    id: 'srv-6',
    businessName: 'Academia Educar+',
    name: 'Tutoría de Matemáticas y Física',
    category: 'Educación y Tutorías',
    description: 'Clases particulares personalizadas para nivel secundario o universitario. Resolución de problemas paso a paso.',
    durationMinutes: 60,
    price: 30.0,
    isAvailable: true,
    rating: 4.9,
    reviewsCount: 14,
  },
];

const INITIAL_BOOKINGS: (ServiceBookingRequest & { id: string; status: 'Confirmada' | 'Completada' })[] = [
  {
    id: 'bk-1',
    serviceId: 'srv-1',
    serviceName: 'Masaje Terapéutico Descontracturante',
    clientEmail: 'cliente.demo@example.com',
    clientName: 'Ana Gómez',
    date: '2026-09-20',
    timeSlot: '10:00 AM',
    notes: 'Enfoque en zona cervical.',
    status: 'Confirmada',
  },
];

const SERVICES_KEY = 'promarket_services_catalog_v2';
const BOOKINGS_KEY = 'promarket_mock_bookings_v2';

function getStoredServices(): Service[] {
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (!raw) {
      localStorage.setItem(SERVICES_KEY, JSON.stringify(INITIAL_SERVICES));
      return INITIAL_SERVICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SERVICES;
  }
}

function saveStoredServices(services: Service[]): void {
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  } catch (e) {
    console.error('Error guardando servicios', e);
  }
}

export function getStoredBookings(): (ServiceBookingRequest & { id: string; status: 'Confirmada' | 'Completada' })[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveStoredBookings(bookings: (ServiceBookingRequest & { id: string; status: 'Confirmada' | 'Completada' })[]): void {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error('Error guardando reservas', e);
  }
}

export async function fetchAllServices(): Promise<Service[]> {
  return Promise.resolve(getStoredServices());
}

export async function fetchProviderServices(providerBusinessName?: string): Promise<Service[]> {
  const all = getStoredServices();
  if (!providerBusinessName) return Promise.resolve(all);
  return Promise.resolve(
    all.filter((s) => s.businessName?.toLowerCase() === providerBusinessName.toLowerCase())
  );
}

export async function createService(serviceData: Omit<Service, 'id'>): Promise<Service> {
  const all = getStoredServices();
  const newService: Service = {
    ...serviceData,
    id: `srv-${Date.now()}`,
    rating: 5.0,
    reviewsCount: 0,
  };
  const updated = [newService, ...all];
  saveStoredServices(updated);
  return Promise.resolve(newService);
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  const all = getStoredServices();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Servicio no encontrado');
  const updatedItem = { ...all[idx], ...updates };
  all[idx] = updatedItem;
  saveStoredServices(all);
  return Promise.resolve(updatedItem);
}

export async function toggleServiceAvailability(id: string): Promise<Service> {
  const all = getStoredServices();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Servicio no encontrado');
  all[idx].isAvailable = !all[idx].isAvailable;
  saveStoredServices(all);
  return Promise.resolve(all[idx]);
}

export async function bookAppointment(
  req: ServiceBookingRequest
): Promise<{ success: boolean; message: string }> {
  const bookings = getStoredBookings();
  const newBooking = {
    ...req,
    id: `bk-${Date.now()}`,
    status: 'Confirmada' as const,
  };
  saveStoredBookings([newBooking, ...bookings]);

  return Promise.resolve({
    success: true,
    message: `Reserva agendada para "${req.serviceName}" el ${req.date} a las ${req.timeSlot}.`,
  });
}
