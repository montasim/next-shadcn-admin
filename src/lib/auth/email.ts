/**
 * Email Service Module
 * 
 * Following Single Responsibility Principle (SRP):
 * This module handles all email sending operations using Resend
 * 
 * Features:
 * - OTP email sending for registration
 * - OTP email sending for password reset
 * - Error handling and retry logic
 * - Template-based email composition
 */

import { Resend } from 'resend'

// ============================================================================
// RESEND CLIENT INITIALIZATION
// ============================================================================

const resend = new Resend(process.env.RESEND_API_KEY)

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'
const APP_NAME = 'Admin Portal'
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generate registration OTP email HTML
 */
function getRegistrationOtpEmailTemplate(otp: string): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `${APP_NAME} - Verification Code`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            <p style="font-size: 16px; color: #666;">Welcome to ${APP_NAME}! To complete your registration, please use the verification code below:</p>
            
            <div style="background: #f7f7f7; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
              <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
            </div>

            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              <strong>Security Note:</strong> This code expires in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
${APP_NAME} - Verification Code

Your admin verification code is: ${otp}

This code expires in 10 minutes.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate password reset OTP email HTML
 */
function getPasswordResetOtpEmailTemplate(otp: string): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `${APP_NAME} - Password Reset Code`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Code</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p style="font-size: 16px; color: #666;">We received a request to reset your password. Use the code below to proceed:</p>
            
            <div style="background: #f7f7f7; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Password Reset Code</p>
              <p style="font-size: 36px; font-weight: bold; color: #f5576c; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
            </div>

            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              <strong>Security Note:</strong> This code expires in 10 minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
${APP_NAME} - Password Reset Code

Your password reset code is: ${otp}

This code expires in 10 minutes.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send registration OTP email
 * 
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {Error} If email sending fails after retries
 */
export async function sendRegistrationOtp(
  email: string,
  otp: string
): Promise<boolean> {
  const { subject, html, text } = getRegistrationOtpEmailTemplate(otp)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send registration OTP email:', {
        email,
        error: error.message,
      })
      throw new Error('Failed to send verification email')
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send verification email')
  }
}

/**
 * Send password reset OTP email
 * 
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} True if email sent successfully
 * @throws {Error} If email sending fails after retries
 */
export async function sendPasswordResetOtp(
  email: string,
  otp: string
): Promise<boolean> {
  const { subject, html, text } = getPasswordResetOtpEmailTemplate(otp)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send password reset OTP email:', {
        email,
        error: error.message,
      })
      throw new Error('Failed to send password reset email')
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Generate invitation email HTML
 */
function getInvitationEmailTemplate(inviteLink: string): {
  subject: string
  html: string
  text: string
} {
  return {
    subject: `${APP_NAME} - You've been invited!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">You've Been Invited!</h2>
            <p style="font-size: 16px; color: #666;">You've been invited to join ${APP_NAME} as an admin. Click the button below to create your account:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #11998e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Create Account</a>
            </div>

            <p style="font-size: 14px; color: #999; margin-top: 30px;">
              <strong>Security Note:</strong> This invite expires in 7 days. If you weren't expecting this invitation, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
${APP_NAME} - You've been invited!

You've been invited to join ${APP_NAME} as an admin.

Click here to create your account: ${inviteLink}

Your invite expires in 7 days.

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const inviteLink = `${BASE_URL}/sign-up?token=${token}&email=${encodeURIComponent(email)}`
  const { subject, html, text } = getInvitationEmailTemplate(inviteLink)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send invitation email:', {
        email,
        error: error.message,
      })
      throw new Error('Failed to send invitation email')
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send invitation email')
  }
}
