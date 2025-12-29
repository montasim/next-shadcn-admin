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
  INVITED = 'INVITED',
  EMAIL_CHANGE = 'EMAIL_CHANGE',
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
  user: {
    id: string
    email: string
    name: string
    role: string
    isPremium?: boolean
  }
}

export interface SendOtpResponse {
  success: true
  expiresAt: string
  sessionCreated?: boolean
}

export interface VerifyOtpResponse {
  verified: true
  sessionExpiresAt: string
}

export interface CreateAccountResponse {
  success: true
  user: {
    id: string
    email: string
    name: string
    role: string
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
  userId: string
  email: string
  name: string
  firstName: string
  lastName: string | null
  role: string
  isPremium?: boolean
  avatar?: string | null
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

// ============================================================================
// INVITE TYPES
// ============================================================================

export interface InviteData {
  id: string
  email: string
  token: string
  invitedBy: string
  role: string
  desc?: string
  expiresAt: Date
  used: boolean
  createdAt: Date
  usedAt?: Date
}

export interface CreateInviteResponse {
  success: true
  invite: {
    id: string
    email: string
    role: string
    expiresAt: string
  }
}
