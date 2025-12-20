/**
 * Input Validation Utilities
 * 
 * Following Single Responsibility Principle (SRP):
 * This module handles all input validation for the authentication system
 * 
 * Validates:
 * - Email addresses (RFC 5322 compliant)
 * - Password strength
 * - Auth intents
 * - OTP format
 */

import { AuthIntent, PasswordValidationResult } from './types'

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email address format (RFC 5322 compliant)
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false
    }

    // RFC 5322 compliant email regex
    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    return emailRegex.test(email)
}

/**
 * Sanitize email address (lowercase and trim)
 * 
 * @param {string} email - Email address to sanitize
 * @returns {string} Sanitized email
 */
export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim()
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate password strength with detailed error messages
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password - Password to validate
 * @returns {PasswordValidationResult} Validation result with errors
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = []

    if (!password || typeof password !== 'string') {
        return {
            valid: false,
            errors: ['Password is required'],
        }
    }

    // Minimum length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    }

    // Maximum length check (prevent DoS via bcrypt)
    if (password.length > 72) {
        errors.push('Password must be no more than 72 characters long')
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    }

    // Number check
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number')
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Quick password validation (returns boolean only)
 * 
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid
 */
export function isPasswordValid(password: string): boolean {
    return validatePassword(password).valid
}

// ============================================================================
// AUTH INTENT VALIDATION
// ============================================================================

/**
 * Validate auth intent value
 * 
 * @param {string} intent - Intent to validate
 * @returns {boolean} True if intent is valid
 */
export function validateIntent(intent: string): boolean {
    return Object.values(AuthIntent).includes(intent as AuthIntent)
}

/**
 * Type guard for AuthIntent
 * 
 * @param {string} value - Value to check
 * @returns {boolean} True if value is a valid AuthIntent
 */
export function isAuthIntent(value: string): value is AuthIntent {
    return validateIntent(value)
}

// ============================================================================
// OTP VALIDATION
// ============================================================================

/**
 * Validate OTP format (7 digits)
 * 
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if OTP format is valid
 */
export function validateOtpFormat(otp: string): boolean {
    if (!otp || typeof otp !== 'string') {
        return false
    }

    // Must be exactly 7 digits
    return /^\d{7}$/.test(otp)
}

// ============================================================================
// NAME VALIDATION
// ============================================================================

/**
 * Validate admin name
 * 
 * @param {string} name - Name to validate
 * @returns {boolean} True if name is valid
 */
export function validateName(name: string): boolean {
    if (!name || typeof name !== 'string') {
        return false
    }

    // Name must be between 1 and 100 characters
    const trimmedName = name.trim()
    return trimmedName.length >= 1 && trimmedName.length <= 100
}

/**
 * Sanitize name (trim and remove extra spaces)
 * 
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
export function sanitizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ')
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validate request body contains required fields
 * 
 * @param {any} body - Request body to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {string | null} Error message if validation fails, null otherwise
 */
export function validateRequiredFields(
    body: any,
    requiredFields: string[]
): string | null {
    if (!body || typeof body !== 'object') {
        return 'Invalid request body'
    }

    for (const field of requiredFields) {
        if (!(field in body) || body[field] === undefined || body[field] === null) {
            return `Missing required field: ${field}`
        }

        // Check for empty strings
        if (typeof body[field] === 'string' && body[field].trim() === '') {
            return `Field cannot be empty: ${field}`
        }
    }

    return null
}
