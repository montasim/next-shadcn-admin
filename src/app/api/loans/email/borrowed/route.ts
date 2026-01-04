/**
 * Book Borrowed Email Notification API Route
 *
 * Sends email when a book is borrowed using the existing email system
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserDisplayName } from '@/lib/utils/user'
import { Resend } from 'resend'
import { config } from '@/config'
import { getSiteName, getSupportEmail } from '@/lib/utils/site-settings'

const resend = new Resend(config.resendApiKey)
const FROM_EMAIL = config.fromEmail || 'onboarding@resend.dev'
const BASE_URL = config.baseUrl || 'http://localhost:3000'

/**
 * Email template wrapper using the existing system
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
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; min-width: 100%; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; transition: all 0.2s ease; }
    .button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3); }
    .info-box { background-color: #eff6ff; border-left: 4px solid #1e3a5f; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box; text-align: center; }
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
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">${siteName}</h1>
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
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Book Borrowed Email Template
 */
async function getBookBorrowedEmailTemplate(
  userName: string,
  bookName: string,
  dueDate: string,
  notes?: string
): Promise<{ subject: string; html: string }> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()
  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
      Book Borrowed Successfully! 📚
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0; text-align: center;">
      Hi ${userName}, you've successfully borrowed a book from ${APP_NAME}.
    </p>

    <!-- Book Details -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px dashed #86efac; border-radius: 16px; padding: 32px 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0 0 16px 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
        Borrowed Book
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; line-height: 1.4;">
        "${bookName}"
      </p>
    </div>

    <!-- Due Date -->
    <div class="info-box">
      <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">
        📅 Due Date:
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 600;">
        ${dueDate}
      </p>
      ${notes ? `<p style="margin: 12px 0 0 0; color: #64748b; font-size: 13px;"><em>${notes}</em></p>` : ''}
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
        <strong>📝 Please Remember:</strong><br />
        Return the book by the due date. You'll receive a reminder email one day before the due date.
      </p>
    </div>

    <!-- Action Button -->
    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/profile/loans" class="button">View My Borrowed Books</a>
    </div>
  `

  return {
    subject: `Book Borrowed: ${bookName}`,
    html: emailTemplateWrapper(content, 'Book Borrowed Successfully', appName, supportEmail)
  }
}

/**
 * Send book borrowed email using existing system
 * POST /api/loans/email/borrowed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loanId, userId } = body

    if (!loanId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch loan details
    const loan = await prisma.bookLoan.findUnique({
      where: { id: loanId },
      include: {
        book: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } }
      }
    })

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const userName = getUserDisplayName({
      firstName: loan.user.firstName,
      lastName: loan.user.lastName,
      username: loan.user.username,
      name: '',
      email: loan.user.email
    })

    const dueDateStr = loan.dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const { subject, html } = await getBookBorrowedEmailTemplate(
      userName,
      loan.book.name,
      dueDateStr,
      loan.notes || undefined
    )

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: loan.user.email,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send borrowed email:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error) {
    console.error('Borrowed email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
