import { request } from '@/api/client';

/** HU-06: perfil del negocio del proveedor con sesión. `email` es el de la cuenta: solo lectura. */
export interface BusinessProfile {
  message: string | null;
  businessId: string;
  name: string;
  category: string;
  description: string | null;
  address: string;
  phone: string;
  email: string;
}

export interface BusinessProfileUpdate {
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
}

export async function fetchBusinessProfile(): Promise<BusinessProfile> {
  return request<BusinessProfile>('/api/v1/business/profile');
}

/** 400 con el motivo si algún dato no es válido; en ese caso el backend no guarda nada. */
export async function updateBusinessProfile(data: BusinessProfileUpdate): Promise<BusinessProfile> {
  return request<BusinessProfile>('/api/v1/business/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name.trim(),
      category: data.category,
      description: data.description.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
    }),
  });
}
