export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  price: number;
  currency: string;
  businessId?: string;
  businessName?: string;
  businessCategory?: string;
  available: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export type ServiceCategory =
  | 'Todas'
  | 'Salud y Bienestar'
  | 'Belleza'
  | 'Hogar'
  | 'Educacion'
  | 'Tecnologia'
  | 'Gastronomia'
  | 'Otros';

/** Categorías tal como las guarda el backend (etiquetas en minúsculas dentro de la query). */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Todas',
  'Salud y Bienestar',
  'Belleza',
  'Hogar',
  'Educacion',
  'Tecnologia',
  'Gastronomia',
  'Otros',
];
