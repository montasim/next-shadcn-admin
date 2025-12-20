/**
 * Authentication Type Definitions
 * 
 * Following Single Responsibility Principle (SRP):
 * This file contains only type definitions for the authentication system
 */

// ============================================================================
// AUTH INTENTS - Enum for authentication flow types
// ============================================================================
export enum AuthIntent {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CheckEmailResponse {
  exists?: boolean
  canLogin?: boolean
  canRegister?: boolean
  canResetPassword?: boolean
  resumeRegistration?: boolean
  resumeReset?: boolean
}

export interface LoginResponse {
  success: true
  admin: {
    id: string
    email: string
    name: string
  }
}

export interface SendOtpResponse {
  success: true
  expiresAt: string
}

export interface VerifyOtpResponse {
  verified: true
  sessionExpiresAt: string
}

export interface CreateAccountResponse {
  success: true
  admin: {
    id: string
    email: string
    name: string
  }
}

// ============================================================================
// OTP TYPES
// ============================================================================

export interface OtpData {
  id: string
  email: string
  codeHash: string
  intent: string
  used: boolean
  expiresAt: Date
  createdAt: Date
}

// ============================================================================
// AUTH SESSION TYPES
// ============================================================================

export interface AuthSessionData {
  id: string
  email: string
  intent: string
  expiresAt: Date
  createdAt: Date
}

export interface LoginSessionData {
  adminId: string
  email: string
  name: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Too many requests. Please try again later.',
    public retryAfter: number = 60
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class SessionExpiredError extends Error {
  constructor(message: string = 'Session expired. Please start again.') {
    super(message)
    this.name = 'SessionExpiredError'
  }
}
