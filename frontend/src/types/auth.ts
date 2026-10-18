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
  /** Session token from the backend; it, not the email, identifies the user in every request. */
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  recaptchaToken: string;
}

export interface LoginResponse {
  message: string;
  email: string;
  role: UserRole;
  redirectTo: string;
  token: string;
}

export interface RegisterClientDTO {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  password: string;
  termsAccepted: boolean;
  recaptchaToken: string;
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
  token: string;
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
  recaptchaToken: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  address: string;
}
