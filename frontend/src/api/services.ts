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
