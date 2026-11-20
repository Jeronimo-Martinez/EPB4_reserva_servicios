import { request } from '@/api/client';
import {
  LoginCredentials,
  LoginResponse,
  RegisterClientDTO,
  RegisterClientResponse,
  RegisterProviderDTO,
  VerifyCodeDTO,
  VerifyCodeResponse,
  ResendCodeDTO,
  ResendCodeResponse,
  UserRole,
} from '@/types/auth';

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      recaptchaToken: credentials.recaptchaToken,
    }),
  });
}

export async function registerClientApi(
  data: RegisterClientDTO
): Promise<RegisterClientResponse> {
  return request<RegisterClientResponse>('/api/v1/registrations', {
    method: 'POST',
    body: JSON.stringify({
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() || '',
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      password: data.password,
      termsAccepted: data.termsAccepted,
      recaptchaToken: data.recaptchaToken,
    }),
  });
}

export async function registerProviderApi(
  data: RegisterProviderDTO
): Promise<RegisterClientResponse> {
  return request<RegisterClientResponse>('/api/v1/registrations/provider', {
    method: 'POST',
    body: JSON.stringify({
      firstName: data.firstName.trim(),
      lastName: data.lastName?.trim() || '',
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      password: data.password,
      termsAccepted: data.termsAccepted,
      businessName: data.businessName.trim(),
      businessCategory: data.businessCategory,
      businessDescription: data.businessDescription.trim(),
      address: data.address.trim(),
      recaptchaToken: data.recaptchaToken,
    }),
  });
}

export async function verifyCodeApi(
  data: VerifyCodeDTO
): Promise<VerifyCodeResponse> {
  return request<VerifyCodeResponse>('/api/v1/registrations/verify', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
    }),
  });
}

export async function resendCodeApi(
  data: ResendCodeDTO
): Promise<ResendCodeResponse> {
  return request<ResendCodeResponse>('/api/v1/registrations/resend-code', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
    }),
  });
}

export interface ProfileData {
  message: string | null;
  firstName: string;
  lastName: string | null;
  /** Solo lectura: el correo verificado y el rol no se pueden cambiar (HU-05). */
  email: string;
  phone: string;
  role: UserRole;
  verified: boolean;
}

export async function fetchProfile(): Promise<ProfileData> {
  return request<ProfileData>('/api/v1/profile');
}

export async function updateProfile(data: { firstName: string; lastName: string; phone: string }): Promise<ProfileData> {
  return request<ProfileData>('/api/v1/profile', { method: 'PUT', body: JSON.stringify(data) });
}

/** Closes the session on the backend so the token stops working right away. */
export async function logoutApi(): Promise<void> {
  await request<void>('/api/v1/auth/logout', { method: 'POST' });
}
