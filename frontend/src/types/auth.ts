export type UserRole = 'CLIENTE' | 'PROVEEDOR';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  businessName?: string;
  businessCategory?: string;
  isVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  email: string;
  role: UserRole;
  redirectTo: string;
}

export interface RegisterClientDTO {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
}

export interface RegisterClientResponse {
  message: string;
  email: string;
  verificationRequired: boolean;
}

export interface VerifyCodeDTO {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  message: string;
  email: string;
  role: UserRole;
}

export interface ResendCodeDTO {
  email: string;
}

export interface ResendCodeResponse {
  message: string;
  email: string;
}

export interface RegisterProviderDTO {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  address: string;
}
