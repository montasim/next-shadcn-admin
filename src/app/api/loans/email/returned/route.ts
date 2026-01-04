/**
 * Book Returned Email Notification API Route
 *
 * Sends email when a book is returned using the existing email system
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

function emailTemplateWrapper(content: string, previewText?: string, appName?: string, supportEmail?: string): string {
  const siteName = appName || 'Book Heaven'
  const support = supportEmail || 'support@bookheaven.com'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; }
    .info-box { background-color: #eff6ff; border-left: 4px solid #1e3a5f; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="background-color: #f8fafc; padding: 32px 16px;">
    <div class="email-container" style="border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8f 100%); padding: 48px 32px 32px 32px; text-align: center;">
        <div style="color: #ffffff; font-size: 32px; font-weight: 800;">📚 ${siteName}</div>
      </div>
      <div style="padding: 48px 40px 32px 40px;">
        ${content}
      </div>
      <div style="background-color: #f8fafc; padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

async function getBookReturnedEmailTemplate(
  userName: string,
  bookName: string,
  returnDate: string,
  isAdmin: boolean
): Promise<{ subject: string; html: string }> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; text-align: center;">
      Book Returned Successfully! ✅
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
      ${isAdmin ? `${userName} has returned the book.` : 'You have successfully returned the book to'} ${appName}.
    </p>

    <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Returned Book
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">
        "${bookName}"
      </p>
    </div>

    <div class="info-box">
      <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">
        📅 Return Date:
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 600;">
        ${returnDate}
      </p>
    </div>

    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 32px 0 0 0;">
      ${isAdmin ? 'The book is now available for lending again.' : 'Thank you for returning the book on time! We hope you enjoyed reading it.'}
    </p>

    ${!isAdmin ? `
    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/profile/loans" class="button">View My Borrowed Books</a>
    </div>
    ` : `
    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard/loans" class="button">Manage Loans</a>
    </div>
    `}
  `

  return {
    subject: `Book Returned: ${bookName}`,
    html: emailTemplateWrapper(content, 'Book Returned Successfully', appName, supportEmail)
  }
}

/**
 * Send book returned email using existing system
 * POST /api/loans/email/returned
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
        user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        lentBy: { select: { id: true, firstName: true, lastName: true, email: true } }
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

    const returnDateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Send email to user
    const userEmailTemplate = await getBookReturnedEmailTemplate(
      userName,
      loan.book.name,
      returnDateStr,
      false
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: loan.user.email,
      subject: userEmailTemplate.subject,
      html: userEmailTemplate.html,
    })

    // Send email to admin
    const adminEmailTemplate = await getBookReturnedEmailTemplate(
      userName,
      loan.book.name,
      returnDateStr,
      true
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: loan.lentBy.email,
      subject: adminEmailTemplate.subject,
      html: adminEmailTemplate.html,
    })

    return NextResponse.json({ success: true, message: 'Emails sent successfully' })
  } catch (error) {
    console.error('Returned email error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
