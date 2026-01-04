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
import { markdownToHtml, generateUnsubscribeUrl } from '@/lib/utils/markdown'
import { getSiteName, getSupportEmail } from '@/lib/utils/site-settings'

// Re-export utility functions from the markdown module
// These are safe to use in both client and server components
export { markdownToHtml, generateUnsubscribeUrl }

// ============================================================================
// RESEND CLIENT INITIALIZATION
// ============================================================================

const resend = new Resend(config.resendApiKey)

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

const FROM_EMAIL = config.fromEmail || 'onboarding@resend.dev'
const BASE_URL = config.baseUrl || 'http://localhost:3000'

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Industry-standard email template wrapper
 * Modern, clean design with responsive layout
 */
function emailTemplateWrapper(content: string, previewText?: string, appName?: string, supportEmail?: string): string {
  const siteName = appName || 'Book Heaven'
  const support = supportEmail || 'support@bookheaven.com'

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="subject" content="${previewText || siteName}">
  <title>${siteName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; min-width: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; transition: all 0.2s ease; }
    .button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3); }
    .button-secondary { background: linear-gradient(135deg, #64748b 0%, #475569 100%); }
    .button-danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .button-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .otp-container { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 16px; padding: 32px 24px; margin: 32px 0; position: relative; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1e3a5f; text-align: center; font-family: 'Inter', monospace; line-height: 1; margin: 16px 0; }
    .otp-label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin: 0; }
    .footer-link { color: #64748b; text-decoration: underline; transition: color 0.2s; }
    .footer-link:hover { color: #1e3a5f; }
    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
    .info-box { background-color: #eff6ff; border-left: 4px solid #1e3a5f; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box; text-align: center; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
      .otp-container { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="background-color: #f8fafc; padding: 32px 16px;">
    <div class="email-container" style="border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); padding: 48px 32px 32px 32px; text-align: center; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1;">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 50%; width: 64px; height: 64px; line-height: 64px; margin-bottom: 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 style="color: #1e3a5f; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">${siteName}</h1>
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 48px 40px 32px 40px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 500;">
          &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
          This email was sent to <a href="mailto:{{email}}" style="color: #64748b; text-decoration: none; font-weight: 500;">{{email}}</a>.
          <a href="${BASE_URL}/unsubscribe" class="footer-link">Unsubscribe</a> if you don't want to receive these emails.
        </p>
      </div>
    </div>

    <!-- Footer Links -->
    <div style="text-align: center; margin-top: 24px; padding: 0 16px;">
      <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 12px;">
        Need help? <a href="mailto:${support}" style="color: #64748b; text-decoration: underline; font-weight: 500;">Contact Support</a>
      </p>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        <a href="${BASE_URL}/privacy" style="color: #94a3b8; text-decoration: none; margin: 0 8px;">Privacy</a>
        <span style="color: #cbd5e1;">•</span>
        <a href="${BASE_URL}/terms" style="color: #94a3b8; text-decoration: none; margin: 0 8px;">Terms</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate registration OTP email HTML
 * Modern, clean design with prominent OTP display
 */
async function getRegistrationOtpEmailTemplate(otp: string, email?: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
        <!-- Greeting -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Welcome to ${appName}! 🎉
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          Thanks for signing up! We're thrilled to have you on board.
        </p>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
          To complete your registration, please enter this verification code:
        </p>

        <!-- OTP Code - Prominent Display -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #93c5fd; border-radius: 16px; padding: 32px 24px; margin: 32px 0; position: relative;">
          <p style="color: #1e40af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin: 0;">
            Your Verification Code
          </p>
          <p style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #2563eb; text-align: center; font-family: 'Inter', monospace; line-height: 1; margin: 16px 0;">
            ${otp}
          </p>
          <p style="color: #1d4ed8; font-size: 11px; text-align: center; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
            Valid for 10 minutes
          </p>
        </div>

        <!-- Instructions -->
        <div class="info-box">
          <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
            <strong>📝 How to use:</strong><br />
            Copy the 6-digit code above and paste it into the verification form on your screen.
          </p>
        </div>

        <!-- Important Notes -->
        <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 12px 0; font-weight: 600;">
          Important Information:
        </p>
        <ul style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0 0 32px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">This code expires in <strong>10 minutes</strong> for your security</li>
          <li style="margin-bottom: 8px;">Never share this code with anyone</li>
          <li style="margin-bottom: 8px;">If you didn't create an account, please ignore this email</li>
        </ul>

        <!-- Help Section -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            Didn't receive the code or it expired?
          </p>
          <a href="${BASE_URL}/sign-up?email=${encodeURIComponent(email || '')}" class="button">Request New Code</a>
        </div>
      `

  return {
    subject: `Verify your email - ${appName}`,
    html: emailTemplateWrapper(content, 'Email Verification Required', appName, supportEmail),
    text: `
${appName} - Verify Your Email

Welcome to ${appName}!

Thanks for signing up! Your verification code is:

${otp}

This code will expire in 10 minutes.

If you didn't create an account, please ignore this email.

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate password reset OTP email HTML
 * Modern design with security-focused styling
 */
async function getPasswordResetOtpEmailTemplate(otp: string, email?: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Password Reset Request 🔒
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          We received a request to reset the password for your ${appName} account.
        </p>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
          Use this verification code to reset your password:
        </p>

        <!-- OTP Code - Security Styled -->
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px dashed #fca5a5; border-radius: 16px; padding: 32px 24px; margin: 32px 0; position: relative;">
          <p style="color: #991b1b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin: 0;">
            Password Reset Code
          </p>
          <p style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #dc2626; text-align: center; font-family: 'Inter', monospace; line-height: 1; margin: 16px 0;">
            ${otp}
          </p>
          <p style="color: #b91c1c; font-size: 11px; text-align: center; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
            Valid for 10 minutes
          </p>
        </div>

        <!-- Security Notice -->
        <div class="warning-box">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
            <strong>⚠️ Security Notice:</strong><br />
            Never share this code with anyone. Our team will never ask for your verification code.
          </p>
        </div>

        <!-- Important Notes -->
        <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 12px 0; font-weight: 600;">
          For Your Security:
        </p>
        <ul style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0 0 32px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">This code expires in <strong>10 minutes</strong></li>
          <li style="margin-bottom: 8px;">If you didn't request a password reset, please ignore this email</li>
          <li style="margin-bottom: 8px;">Your password will remain unchanged until you use this code</li>
        </ul>

        <!-- Help Section -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            Code expired or having trouble?
          </p>
          <a href="${BASE_URL}/forgot-password?email=${encodeURIComponent(email || '')}" class="button button-danger">Request New Code</a>
        </div>
      `

  return {
    subject: `Reset your password - ${appName}`,
    html: emailTemplateWrapper(content, 'Password Reset Request', appName, supportEmail),
    text: `
${appName} - Reset Your Password

We received a request to reset your password.

Your password reset code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate email change OTP email HTML
 * Clean, modern design for email verification
 */
async function getEmailChangeOtpEmailTemplate(otp: string, newEmail?: string, oldEmail?: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()
  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Confirm Email Change ✉️
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          You requested to change your email from:
        </p>

        <div style="background: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin: 0 auto 24px auto; max-width: 400px; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">${oldEmail || 'your current email'}</p>
          <div style="margin: 12px 0; color: #94a3b8;">↓</div>
          <p style="margin: 0; color: #1e3a5f; font-size: 16px; font-weight: 700;">${newEmail || 'a new email'}</p>
        </div>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
          Please enter this verification code to confirm:
        </p>

        <!-- OTP Code -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #86efac; border-radius: 16px; padding: 32px 24px; margin: 32px 0; position: relative;">
          <p style="color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin: 0;">
            Email Confirmation Code
          </p>
          <p style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #059669; text-align: center; font-family: 'Inter', monospace; line-height: 1; margin: 16px 0;">
            ${otp}
          </p>
          <p style="color: #047857; font-size: 11px; text-align: center; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
            Valid for 10 minutes
          </p>
        </div>

        <!-- Important Notes -->
        <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 12px 0; font-weight: 600;">
          Important Information:
        </p>
        <ul style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0 0 32px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">This code expires in <strong>10 minutes</strong></li>
          <li style="margin-bottom: 8px;">Your old email will remain active until you verify the new one</li>
          <li style="margin-bottom: 8px;">If you didn't request this change, please ignore this email</li>
        </ul>

        <!-- Help Section -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            Need to make changes?
          </p>
          <a href="${BASE_URL}/settings/profile" class="button button-success">Go to Settings</a>
        </div>
      `

  return {
    subject: `Confirm your email change - ${appName}`,
    html: emailTemplateWrapper(content, 'Email Change Confirmation', appName, supportEmail),
    text: `
${appName} - Confirm Email Change

You requested to change your email from ${oldEmail || 'your current email'} to ${newEmail || 'a new email'}.

Your email confirmation code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this change, please ignore this email.

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate invitation email HTML
 * Modern, attractive invitation design
 */
async function getInvitationEmailTemplate(inviteLink: string, role?: string, desc?: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const roleText = role ? ` as <strong style="color: #1e3a5f;">${role}</strong>` : ''
  const descText = desc
    ? `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #15803d; font-size: 15px; line-height: 1.6;">
            <strong>💬 Message from the inviter:</strong><br />
            <span style="font-style: italic;">"${desc}"</span>
          </p>
        </div>`
    : ''

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          You're Invited! 🎉
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          Great news! You've been invited to join
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <strong style="color: #1e3a5f; font-size: 20px;">${appName}</strong>${roleText}
        </div>

        ${descText}

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
          Click the button below to create your account and get started:
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${inviteLink}" class="button" style="font-size: 17px; padding: 18px 40px; box-shadow: 0 4px 14px rgba(30, 58, 95, 0.25);">
            Create Your Account →
          </a>
        </div>

        <!-- Important Notes -->
        <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 12px 0; font-weight: 600;">
          Important Information:
        </p>
        <ul style="color: #64748b; font-size: 14px; line-height: 1.8; margin: 0 0 32px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">This invitation will expire in <strong>7 days</strong></li>
          <li style="margin-bottom: 8px;">You can only use this invitation link once</li>
          <li style="margin-bottom: 8px;">If you weren't expecting this invitation, please ignore this email</li>
        </ul>

        <!-- Help Section -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Questions? <a href="mailto:${supportEmail}" style="color: #64748b; text-decoration: underline; font-weight: 500;">Contact our support team</a>
          </p>
        </div>
      `

  return {
    subject: `You're invited to join ${appName}`,
    html: emailTemplateWrapper(content, `Invitation to Join ${appName}`, appName, supportEmail),
    text: `
${appName} - You're Invited!

You've been invited to join ${appName}${role ? ` as a ${role}` : ''}.

${desc ? `Message: "${desc}"\n` : ''}

Click here to create your account: ${inviteLink}

This invitation expires in 7 days.

If you weren't expecting this invitation, please ignore this email.

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate login notification email HTML
 * Notifies user when they login to their account
 */
async function getLoginNotificationEmailTemplate(email: string, loginTime: Date, ipAddress?: string, location?: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const formattedTime = loginTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          New Login Detected 🔐
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          We detected a new login to your ${appName} account.
        </p>

        <!-- Login Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 32px 0;">
          <p style="margin: 0 0 16px 0; color: #1e3a5f; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
            Login Details
          </p>
          <div style="display: table; width: 100%; border-collapse: collapse;">
            <div style="display: table-row; border-bottom: 1px solid #e2e8f0;">
              <div style="display: table-cell; padding: 12px 0; color: #64748b; font-size: 14px; font-weight: 500;">Email:</div>
              <div style="display: table-cell; padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${email}</div>
            </div>
            <div style="display: table-row; border-bottom: 1px solid #e2e8f0;">
              <div style="display: table-cell; padding: 12px 0; color: #64748b; font-size: 14px; font-weight: 500;">Time:</div>
              <div style="display: table-cell; padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${formattedTime}</div>
            </div>
            ${ipAddress ? `
            <div style="display: table-row; border-bottom: 1px solid #e2e8f0;">
              <div style="display: table-cell; padding: 12px 0; color: #64748b; font-size: 14px; font-weight: 500;">IP Address:</div>
              <div style="display: table-cell; padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${ipAddress}</div>
            </div>
            ` : ''}
            ${location ? `
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 12px 0; color: #64748b; font-size: 14px; font-weight: 500;">Location:</div>
              <div style="display: table-cell; padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${location}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Security Notice -->
        <div class="warning-box">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
            <strong>🔒 Security Notice:</strong><br />
            If this was you, you can safely ignore this email. If you didn't login to your account, please secure your account immediately.
          </p>
        </div>

        <!-- Action Buttons -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            If this wasn't you, take action:
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="${BASE_URL}/forgot-password?email=${encodeURIComponent(email)}" class="button button-danger" style="min-width: 160px;">Reset Password</a>
            <a href="${BASE_URL}/settings" class="button button-secondary" style="min-width: 160px;">Account Settings</a>
          </div>
        </div>
      `

  return {
    subject: `New login to your ${appName} account`,
    html: emailTemplateWrapper(content, 'New Login Detected', appName, supportEmail),
    text: `
${appName} - New Login Detected

We detected a new login to your ${appName} account.

Email: ${email}
Time: ${formattedTime}
${ipAddress ? `IP Address: ${ipAddress}` : ''}
${location ? `Location: ${location}` : ''}

If this was you, you can safely ignore this email.

If you didn't login to your account, please reset your password immediately: ${BASE_URL}/forgot-password

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate book upload notification email HTML
 * Notifies user when they successfully upload a new book
 */
async function getBookUploadNotificationTemplate(email: string, bookTitle: string, bookId: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Book Uploaded Successfully! 📚
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          Great news! Your book has been successfully uploaded to ${appName}.
        </p>

        <!-- Book Details -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #86efac; border-radius: 16px; padding: 32px 24px; margin: 32px 0; text-align: center;">
          <p style="margin: 0 0 16px 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
            Your New Book
          </p>
          <p style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; line-height: 1.4;">
            "${bookTitle}"
          </p>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
            <strong>📝 Next Steps:</strong><br />
            Your book is currently in <strong>draft status</strong>. You can edit the details, cover image, and make it public when you're ready.
          </p>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            Manage your book or make it public:
          </p>
          <a href="${BASE_URL}/dashboard/books/${bookId}" class="button">Manage Book</a>
        </div>
      `

  return {
    subject: `Book uploaded successfully - ${bookTitle}`,
    html: emailTemplateWrapper(content, 'Book Upload Successful', appName, supportEmail),
    text: `
${appName} - Book Uploaded Successfully

Your book has been successfully uploaded!

Book Title: "${bookTitle}"

Your book is currently in draft status. You can edit the details and make it public when you're ready.

Manage your book here: ${BASE_URL}/dashboard/books/${bookId}

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate book published notification email HTML
 * Notifies user when they make a book public
 */
async function getBookPublishedNotificationTemplate(email: string, bookTitle: string, bookId: string): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Book is Now Live! 🎉
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          Congratulations! Your book is now published and visible to all users on ${appName}.
        </p>

        <!-- Book Details -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px dashed #fbbf24; border-radius: 16px; padding: 32px 24px; margin: 32px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
            Now Live on ${appName}
          </p>
          <p style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; line-height: 1.4;">
            "${bookTitle}"
          </p>
          <p style="margin: 16px 0 0 0; color: #78350f; font-size: 14px;">
            ✨ Your book is now discoverable by all users
          </p>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
            <strong>💡 Pro Tip:</strong><br />
            Share your book link on social media to increase visibility and engage with readers who are interested in your content!
          </p>
        </div>

        <!-- Action Buttons -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            View your book or manage settings:
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="${BASE_URL}/books/${bookId}" class="button" style="min-width: 160px;">View Book</a>
            <a href="${BASE_URL}/dashboard/books/${bookId}" class="button button-secondary" style="min-width: 160px;">Manage Book</a>
          </div>
        </div>
      `

  return {
    subject: `Your book is now live - ${bookTitle}`,
    html: emailTemplateWrapper(content, 'Book Published Successfully', appName, supportEmail),
    text: `
${appName} - Book Published Successfully

Congratulations! Your book is now published and live on ${appName}.

Book Title: "${bookTitle}"

Your book is now discoverable by all users. Share it to increase visibility!

View your book: ${BASE_URL}/books/${bookId}
Manage your book: ${BASE_URL}/dashboard/books/${bookId}

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate achievement unlocked notification email HTML
 * Notifies user when they earn an achievement
 */
async function getAchievementUnlockedNotificationTemplate(
  email: string,
  achievementTitle: string,
  achievementDescription: string,
  badgeIcon?: string
): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Achievement Unlocked! 🏆
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          Congratulations! You've earned a new achievement on ${appName}.
        </p>

        <!-- Achievement Badge -->
        <div style="background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%); border: 2px dashed #facc15; border-radius: 16px; padding: 32px 24px; margin: 32px 0; text-align: center;">
          <div style="display: inline-block; background: #fff; border-radius: 50%; width: 80px; height: 80px; line-height: 80px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <span style="font-size: 40px;">🏆</span>
          </div>
          <p style="margin: 0 0 8px 0; color: #854d0e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
            Achievement Unlocked
          </p>
          <p style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; line-height: 1.4;">
            "${achievementTitle}"
          </p>
          <p style="margin: 12px 0 0 0; color: #713f12; font-size: 14px; line-height: 1.6;">
            ${achievementDescription}
          </p>
        </div>

        <!-- Encouragement -->
        <div class="info-box">
          <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
            <strong>🌟 Keep Going!</strong><br />
            You're making great progress! Continue exploring ${appName} to unlock more achievements and reach new milestones.
          </p>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            View all your achievements:
          </p>
          <a href="${BASE_URL}/achievements" class="button">View Achievements</a>
        </div>
      `

  return {
    subject: `Achievement Unlocked: ${achievementTitle}`,
    html: emailTemplateWrapper(content, 'New Achievement Earned', appName, supportEmail),
    text: `
${appName} - Achievement Unlocked!

Congratulations! You've earned a new achievement.

Achievement: "${achievementTitle}"
${achievementDescription}

Keep going to unlock more achievements!

View all your achievements: ${BASE_URL}/achievements

Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
    `.trim(),
  }
}

/**
 * Generate password changed notification email HTML
 * Notifies user when their password is successfully changed
 */
async function getPasswordChangedNotificationTemplate(email: string, changedAt: Date): Promise<{
  subject: string
  html: string
  text: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const formattedTime = changedAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  const content = `
        <!-- Header -->
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
          Password Changed Successfully ✅
        </h2>

        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
          Your ${appName} account password has been successfully changed.
        </p>

        <!-- Change Details -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #86efac; border-radius: 16px; padding: 32px 24px; margin: 32px 0; text-align: center;">
          <p style="margin: 0 0 16px 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
            Change Details
          </p>
          <div style="display: table; width: 100%; max-width: 300px; margin: 0 auto; border-collapse: collapse;">
            <div style="display: table-row; border-bottom: 1px solid #86efac;">
              <div style="display: table-cell; padding: 12px 0; color: #047857; font-size: 14px; font-weight: 500;">Email:</div>
              <div style="display: table-cell; padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${email}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 12px 0; color: #047857; font-size: 14px; font-weight: 500;">Time:</div>
              <div style="display: table-cell; padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${formattedTime}</div>
            </div>
          </div>
        </div>

        <!-- Security Notice -->
        <div class="warning-box">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
            <strong>🔒 Security Notice:</strong><br />
            If you didn't make this change, please contact our support team immediately. Your account security is important to us.
          </p>
        </div>

        <!-- Action Button -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">
            Need to manage your account settings?
          </p>
          <a href="${BASE_URL}/settings/account" class="button">Account Settings</a>
        </div>
      `

  return {
    subject: `Password changed successfully - ${appName}`,
    html: emailTemplateWrapper(content, 'Password Changed', appName, supportEmail),
    text: `
${appName} - Password Changed Successfully

Your ${appName} account password has been successfully changed.

Email: ${email}
Time: ${formattedTime}

If you didn't make this change, please contact us immediately.

Manage your account: ${BASE_URL}/settings/account
Need help? Contact us at ${supportEmail}

© ${new Date().getFullYear()} ${appName}. All rights reserved.
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
  const { subject, html, text } = await getRegistrationOtpEmailTemplate(otp, email)

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
  const { subject, html, text } = await getPasswordResetOtpEmailTemplate(otp, email)

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
  const { subject, html, text } = await getEmailChangeOtpEmailTemplate(otp, email, oldEmail)

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
  const { subject, html, text } = await getInvitationEmailTemplate(inviteLink, role, desc)

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

/**
 * Send login notification email
 * Sends a notification when user logs in
 */
export async function sendLoginNotificationEmail(
  email: string,
  loginTime: Date,
  ipAddress?: string,
  location?: string
): Promise<boolean> {
  const { subject, html, text } = await getLoginNotificationEmailTemplate(email, loginTime, ipAddress, location)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send login notification email:', {
        email,
        error: error.message,
      })
      // Don't throw error for non-critical notifications
      return false
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    // Don't throw error for non-critical notifications
    return false
  }
}

/**
 * Send book upload notification email
 * Notifies user when they successfully upload a book
 */
export async function sendBookUploadNotificationEmail(
  email: string,
  bookTitle: string,
  bookId: string
): Promise<boolean> {
  const { subject, html, text } = await getBookUploadNotificationTemplate(email, bookTitle, bookId)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send book upload notification email:', {
        email,
        error: error.message,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * Send book published notification email
 * Notifies user when they make a book public
 */
export async function sendBookPublishedNotificationEmail(
  email: string,
  bookTitle: string,
  bookId: string
): Promise<boolean> {
  const { subject, html, text } = await getBookPublishedNotificationTemplate(email, bookTitle, bookId)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send book published notification email:', {
        email,
        error: error.message,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * Send achievement unlocked notification email
 * Notifies user when they earn an achievement
 */
export async function sendAchievementUnlockedNotificationEmail(
  email: string,
  achievementTitle: string,
  achievementDescription: string,
  badgeIcon?: string
): Promise<boolean> {
  const { subject, html, text } = await getAchievementUnlockedNotificationTemplate(
    email,
    achievementTitle,
    achievementDescription,
    badgeIcon
  )

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send achievement notification email:', {
        email,
        error: error.message,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * Send password changed notification email
 * Notifies user when their password is successfully changed
 */
export async function sendPasswordChangedNotificationEmail(
  email: string,
  changedAt: Date
): Promise<boolean> {
  const { subject, html, text } = await getPasswordChangedNotificationTemplate(email, changedAt)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send password changed notification email:', {
        email,
        error: error.message,
      })
      throw new Error('Failed to send password changed notification')
    }

    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send password changed notification')
  }
}

// ============================================================================
// CAMPAIGN EMAIL FUNCTIONS
// ============================================================================

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
async function getCampaignEmailTemplate(
  subject: string,
  previewText: string | undefined,
  htmlContent: string,
  unsubscribeUrl: string
): Promise<{
  subject: string
  html: string
}> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
        ${htmlContent}

        <!-- Unsubscribe Section -->
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            You received this email because you subscribed to marketing emails from ${appName}.
            <br />
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> from these emails.
          </p>
        </div>
      `

  return {
    subject,
    html: emailTemplateWrapper(content, previewText, appName, supportEmail),
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
  const { html } = await getCampaignEmailTemplate(
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

// generateUnsubscribeUrl is now exported from '@/lib/utils/markdown'
// and re-exported here for backward compatibility
