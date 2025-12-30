/**
 * Email Service Module
 *
 * Following Single Responsibility Principle (SRP):
 * This module handles all email sending operations using Resend
 *
 * Features:
 * - OTP email sending for registration
 * - OTP email sending for password reset
 * - OTP email sending for email changes
 * - Campaign email sending with Markdown support
 * - Error handling and retry logic
 * - Industry-standard email templates
 */

import { Resend } from 'resend'
import { config } from '@/config'
import { marked } from 'marked'

// ============================================================================
// RESEND CLIENT INITIALIZATION
// ============================================================================

const resend = new Resend(config.resendApiKey)

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

const FROM_EMAIL = config.fromEmail || 'onboarding@resend.dev'
const APP_NAME = 'Book Heaven'
const BASE_URL = config.baseUrl || 'http://localhost:3000'
const SUPPORT_EMAIL = 'support@bookheaven.com'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Industry-standard email template wrapper
 */
function emailTemplateWrapper(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${APP_NAME}</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
    .v-text {padding: 0!important;margin: 0!important;}
  </style>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; min-width: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; }
    .button { display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .button:hover { background-color: #4338ca; }
    .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; text-align: center; font-family: 'Courier New', monospace; }
    .footer-link { color: #6b7280; text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box; }
      .otp-code { font-size: 28px !important; letter-spacing: 4px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="background-color: #f9fafb; padding: 40px 20px;">
    <div class="email-container" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 40px 30px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${APP_NAME}</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px 40px 30px 40px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
          &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          This email was sent to <a href="mailto:{{email}}" style="color: #6b7280; text-decoration: none;">{{email}}</a>.
          <a href="${BASE_URL}/unsubscribe" class="footer-link">Unsubscribe</a> if you don't want to receive these emails.
        </p>
      </div>
    </div>

    <!-- Footer Links -->
    <div style="text-align: center; margin-top: 30px; padding: 0 20px;">
      <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
        Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color: #6b7280; text-decoration: underline;">Contact Support</a>
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        <a href="${BASE_URL}/privacy" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
        <span style="color: #d1d5db;">•</span>
        <a href="${BASE_URL}/terms" style="color: #9ca3af; text-decoration: none; margin: 0 10px;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate registration OTP email HTML
 */
function getRegistrationOtpEmailTemplate(otp: string, email?: string): {
  subject: string
  html: string
  text: string
} {
  const content = `
        <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
          Verify your email address
        </h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Thanks for signing up for ${APP_NAME}! We're excited to have you on board.
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          To complete your registration, please verify your email address using the code below:
        </p>

        <!-- OTP Code -->
        <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #4f46e5; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            Your verification code
          </p>
          <p class="otp-code" style="margin: 0;">${otp}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
          <strong>Important:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 8px 0; padding-left: 20px;">
          <li>This code will expire in <strong>10 minutes</strong></li>
          <li>Enter this code on the verification page to complete your registration</li>
          <li>If you didn't create an account with ${APP_NAME}, please ignore this email</li>
        </ul>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            If you're having trouble, click the button below to request a new code:
          </p>
          <div style="margin-top: 16px;">
            <a href="${BASE_URL}/sign-up?email=${encodeURIComponent(email || '')}" class="button">Request New Code</a>
          </div>
        </div>
      `

  return {
    subject: `Verify your email address - ${APP_NAME}`,
    html: emailTemplateWrapper(content),
    text: `
${APP_NAME} - Verify Your Email

Thanks for signing up for ${APP_NAME}!

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't create an account, please ignore this email.

Need help? Contact us at ${SUPPORT_EMAIL}

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate password reset OTP email HTML
 */
function getPasswordResetOtpEmailTemplate(otp: string, email?: string): {
  subject: string
  html: string
  text: string
} {
  const content = `
        <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
          Reset your password
        </h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          We received a request to reset the password for your ${APP_NAME} account.
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Use the verification code below to reset your password:
        </p>

        <!-- OTP Code -->
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            Password reset code
          </p>
          <p class="otp-code" style="margin: 0; color: #dc2626;">${otp}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
          <strong>For your security:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 8px 0; padding-left: 20px;">
          <li>This code will expire in <strong>10 minutes</strong></li>
          <li>If you didn't request a password reset, please ignore this email</li>
          <li>Your password will remain unchanged until you use this code</li>
        </ul>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            If you're having trouble, click the button below to try again:
          </p>
          <div style="margin-top: 16px;">
            <a href="${BASE_URL}/forgot-password?email=${encodeURIComponent(email || '')}" class="button" style="background-color: #dc2626;">Request New Code</a>
          </div>
        </div>
      `

  return {
    subject: `Reset your password - ${APP_NAME}`,
    html: emailTemplateWrapper(content),
    text: `
${APP_NAME} - Reset Your Password

We received a request to reset your password.

Your password reset code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Need help? Contact us at ${SUPPORT_EMAIL}

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate email change OTP email HTML
 */
function getEmailChangeOtpEmailTemplate(otp: string, newEmail?: string, oldEmail?: string): {
  subject: string
  html: string
  text: string
} {
  const content = `
        <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
          Confirm your email change
        </h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          You requested to change your email address from <strong>${oldEmail || 'your current email'}</strong> to <strong>${newEmail || 'a new email'}</strong>.
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          To complete this change, please verify the new email address using the code below:
        </p>

        <!-- OTP Code -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #059669; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <p style="margin: 0 0 12px 0; color: #065f46; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            Email confirmation code
          </p>
          <p class="otp-code" style="margin: 0; color: #059669;">${otp}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
          <strong>Important:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 8px 0; padding-left: 20px;">
          <li>This code will expire in <strong>10 minutes</strong></li>
          <li>Your old email will remain active until you verify the new one</li>
          <li>If you didn't request this change, please ignore this email</li>
        </ul>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0;">
            If you're having trouble, click the button below to try again:
          </p>
          <div style="margin-top: 16px;">
            <a href="${BASE_URL}/settings/profile" class="button" style="background-color: #059669;">Go to Settings</a>
          </div>
        </div>
      `

  return {
    subject: `Confirm your email change - ${APP_NAME}`,
    html: emailTemplateWrapper(content),
    text: `
${APP_NAME} - Confirm Email Change

You requested to change your email from ${oldEmail || 'your current email'} to ${newEmail || 'a new email'}.

Your email confirmation code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this change, please ignore this email.

Need help? Contact us at ${SUPPORT_EMAIL}

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate invitation email HTML
 */
function getInvitationEmailTemplate(inviteLink: string, role?: string, desc?: string): {
  subject: string
  html: string
  text: string
} {
  const roleText = role ? ` as <strong>${role}</strong>` : ''
  const descText = desc
    ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px; font-style: italic;">"${desc}"</p>
        </div>`
    : ''

  const content = `
        <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
          You're invited!
        </h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Great news! You've been invited to join <strong>${APP_NAME}</strong>${roleText}.
        </p>
        ${descText}
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Click the button below to create your account and get started:
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${inviteLink}" class="button" style="font-size: 18px; padding: 16px 32px;">Create Your Account</a>
        </div>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
          <strong>Important:</strong>
        </p>
        <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 8px 0; padding-left: 20px;">
          <li>This invitation will expire in <strong>7 days</strong></li>
          <li>If you weren't expecting this invitation, please ignore this email</li>
          <li>You can only use this invitation link once</li>
        </ul>
      `

  return {
    subject: `You're invited to join ${APP_NAME}`,
    html: emailTemplateWrapper(content),
    text: `
${APP_NAME} - You're Invited!

You've been invited to join ${APP_NAME}${role ? ` as a ${role}` : ''}.

${desc ? `Note: "${desc}"\n` : ''}

Click here to create your account: ${inviteLink}

This invitation expires in 7 days.

If you weren't expecting this invitation, please ignore this email.

Need help? Contact us at ${SUPPORT_EMAIL}

© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    `.trim(),
  }
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send registration OTP email
 */
export async function sendRegistrationOtp(
  email: string,
  otp: string
): Promise<boolean> {
  const { subject, html, text } = getRegistrationOtpEmailTemplate(otp, email)

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
 */
export async function sendPasswordResetOtp(
  email: string,
  otp: string
): Promise<boolean> {
  const { subject, html, text } = getPasswordResetOtpEmailTemplate(otp, email)

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html,
      text,
    })

    if (result.error) {
      console.error('Failed to send password reset OTP email:', {
        email,
        error: result.error.message,
        errorCode: result.error.name,
      })
      throw new Error(`Failed to send password reset email: ${result.error.message}`)
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error(`Failed to send password reset email: ${error}`)
  }
}

/**
 * Send email change OTP email
 */
export async function sendEmailChangeOtp(
  email: string,
  otp: string,
  oldEmail?: string
): Promise<boolean> {
  const { subject, html, text } = getEmailChangeOtpEmailTemplate(otp, email, oldEmail)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send email change OTP email:', {
        email,
        error: error.message,
      })
      throw new Error('Failed to send email change verification code')
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send email change verification code')
  }
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  email: string,
  token: string,
  role?: string,
  desc?: string
): Promise<boolean> {
  const inviteLink = `${BASE_URL}/sign-up?token=${token}&email=${encodeURIComponent(email)}`
  const { subject, html, text } = getInvitationEmailTemplate(inviteLink, role, desc)

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

// ============================================================================
// CAMPAIGN EMAIL FUNCTIONS
// ============================================================================

/**
 * Convert Markdown to HTML
 * Uses the marked library for conversion
 */
export function markdownToHtml(markdown: string): string {
  // Configure marked options for safe HTML
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // Enable GitHub Flavored Markdown
  })

  return marked(markdown) as string
}

/**
 * Replace template variables in content
 * Replaces {{userName}}, {{firstName}}, {{email}}, {{unsubscribeUrl}}
 */
function replaceTemplateVariables(
  content: string,
  variables: {
    userName?: string
    firstName?: string
    email?: string
    unsubscribeUrl?: string
  }
): string {
  let result = content

  if (variables.userName) {
    result = result.replace(/\{\{userName\}\}/g, variables.userName)
  } else {
    result = result.replace(/\{\{userName\}\}/g, '')
  }

  if (variables.firstName) {
    result = result.replace(/\{\{firstName\}\}/g, variables.firstName)
  } else {
    result = result.replace(/\{\{firstName\}\}/g, variables.userName || '')
  }

  if (variables.email) {
    result = result.replace(/\{\{email\}\}/g, variables.email)
  } else {
    result = result.replace(/\{\{email\}\}/g, '')
  }

  if (variables.unsubscribeUrl) {
    result = result.replace(/\{\{unsubscribeUrl\}\}/g, variables.unsubscribeUrl)
  }

  return result
}

/**
 * Generate campaign email HTML template
 */
function getCampaignEmailTemplate(
  subject: string,
  previewText: string | undefined,
  htmlContent: string,
  unsubscribeUrl: string
): {
  subject: string
  html: string
} {
  const content = `
        ${htmlContent}

        <!-- Unsubscribe Section -->
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            You received this email because you subscribed to marketing emails from ${APP_NAME}.
            <br />
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from these emails.
          </p>
        </div>
      `

  return {
    subject,
    html: emailTemplateWrapper(content, previewText),
  }
}

/**
 * Send campaign email to a single recipient
 */
export async function sendCampaignEmail(
  to: string,
  subject: string,
  previewText: string | undefined,
  htmlContent: string,
  variables?: {
    userName?: string
    firstName?: string
    email?: string
    unsubscribeUrl?: string
  }
): Promise<{ success: boolean; error?: string }> {
  // Replace template variables in the HTML content
  const personalizedHtml = variables
    ? replaceTemplateVariables(htmlContent, variables)
    : htmlContent

  // Generate the email template with unsubscribe link
  const { html } = getCampaignEmailTemplate(
    subject,
    previewText,
    personalizedHtml,
    variables?.unsubscribeUrl || `${BASE_URL}/unsubscribe`
  )

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send campaign email:', {
        to,
        error: error.message,
      })
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Campaign email sending error:', error)
    return { success: false, error: error?.message || 'Unknown error' }
  }
}

/**
 * Send campaign email with Markdown content
 * Converts Markdown to HTML before sending
 */
export async function sendCampaignEmailFromMarkdown(
  to: string,
  subject: string,
  previewText: string | undefined,
  markdownContent: string,
  variables?: {
    userName?: string
    firstName?: string
    email?: string
    unsubscribeUrl?: string
  }
): Promise<{ success: boolean; error?: string }> {
  // First convert Markdown to HTML
  const htmlContent = markdownToHtml(markdownContent)

  // Then send as regular campaign email
  return sendCampaignEmail(to, subject, previewText, htmlContent, variables)
}

/**
 * Generate unsubscribe URL for a campaign
 */
export function generateUnsubscribeUrl(campaignId: string, userId: string): string {
  return `${BASE_URL}/api/campaigns/unsubscribe?campaign=${campaignId}&user=${userId}`
}
