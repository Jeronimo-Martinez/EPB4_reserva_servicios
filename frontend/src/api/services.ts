import { request } from '@/api/client';
import { Service } from '@/types/service';

export interface CatalogSearchResponse {
  items: Service[];
  total: number;
  appliedSearch: string | null;
  appliedCategory: string | null;
}

export interface ServiceOfferingResponse {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  available: boolean;
  createdAt: string;
}

export interface ServiceOfferingRequest {
  providerEmail: string;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  available: boolean;
}

export interface AvailabilityRequest {
  providerEmail: string;
  available: boolean;
}

export async function fetchCatalogServices(
  search?: string,
  category?: string
): Promise<CatalogSearchResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category && category !== 'Todas') params.set('category', category);
  const qs = params.toString();
  return request<CatalogSearchResponse>(`/api/v1/catalog${qs ? `?${qs}` : ''}`);
}

export async function fetchProviderServices(
  providerEmail: string
): Promise<ServiceOfferingResponse[]> {
  return request<ServiceOfferingResponse[]>(
    `/api/v1/services?providerEmail=${encodeURIComponent(providerEmail)}`
  );
}

export async function createService(
  data: ServiceOfferingRequest
): Promise<ServiceOfferingResponse> {
  return request<ServiceOfferingResponse>('/api/v1/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(
  id: string,
  data: ServiceOfferingRequest
): Promise<ServiceOfferingResponse> {
  return request<ServiceOfferingResponse>(`/api/v1/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleServiceAvailability(
  id: string,
  data: AvailabilityRequest
): Promise<ServiceOfferingResponse> {
  return request<ServiceOfferingResponse>(`/api/v1/services/${id}/availability`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function fetchCategories(): Promise<{ code: string; label: string }[]> {
  return request<{ code: string; label: string }[]>('/api/v1/services/categories');
}

export interface BusinessDetail {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string;
  phone: string;
  email: string;
  averageRating: number;
  reviewCount: number;
  services: Service[];
}

export interface AvailabilityResponse {
  serviceId: string;
  durationMinutes: number;
  timeZone: string;
  /** "El servicio no tiene disponibilidad proxima" cuando no hay cupos en el rango. */
  message: string | null;
  /** Solo los días con cupos; cada cupo es el instante (UTC) de inicio de la cita. */
  days: { date: string; slots: string[] }[];
}

export async function fetchBusiness(id: string): Promise<BusinessDetail> {
  return request<BusinessDetail>(`/api/v1/catalog/businesses/${id}`);
}

export async function fetchAvailability(
  serviceId: string,
  from: string,
  to: string
): Promise<AvailabilityResponse> {
  return request<AvailabilityResponse>(`/api/v1/catalog/${serviceId}/availability?from=${from}&to=${to}`);
}

/** Negocios cuyo nombre, categoría, descripción, dirección o alguno de sus servicios contiene `search`; sin término, todos. */
export async function searchBusinesses(search?: string): Promise<BusinessDetail[]> {
  const qs = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  return request<BusinessDetail[]>(`/api/v1/catalog/businesses${qs}`);
}
