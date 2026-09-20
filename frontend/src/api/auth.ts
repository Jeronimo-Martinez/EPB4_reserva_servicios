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
} from '@/types/auth';

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
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
