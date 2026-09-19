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
  token?: string;
  user?: User;
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

export interface RegisterProviderDTO {
  businessName: string;
  category: string;
  description: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
}
