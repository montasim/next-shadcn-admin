/**
 * Cron Job API Route - Due Date Reminders
 *
 * This endpoint should be called daily by a cron job to check for loans
 * due in 1 day and send reminder emails to users and admins
 *
 * Recommended: Run once per day at 9 AM
 * Vercel Cron: "0 9 * * *" or "https://your-domain.com/api/cron/loans/remind"
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

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key'

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
    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 8px; }
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

async function getDueDateReminderEmailTemplate(
  userName: string,
  bookName: string,
  dueDate: string
): Promise<{ subject: string; html: string }> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; text-align: center;">
      Return Date Reminder 📚
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
      Hi ${userName}, this is a friendly reminder about your borrowed book.
    </p>

    <div style="background: #fef3c7; border: 2px dashed #fbbf24; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Book Due Tomorrow
      </p>
      <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">
        "${bookName}"
      </p>
      <p style="margin: 16px 0 0 0; color: #92400e; font-size: 14px;">
        📅 Due: ${dueDate}
      </p>
    </div>

    <div class="warning-box">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
        <strong>📝 Remember:</strong><br />
        You have 1 day left to return this book. Please plan accordingly to avoid late fees.
      </p>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/profile/loans" class="button">View My Borrowed Books</a>
    </div>
  `

  return {
    subject: `Return Reminder: ${bookName}`,
    html: emailTemplateWrapper(content, 'Book Return Reminder - Due Tomorrow', appName, supportEmail)
  }
}

async function getAdminReminderEmailTemplate(
  userName: string,
  bookName: string,
  dueDate: string,
  userEmail: string
): Promise<{ subject: string; html: string }> {
  const appName = await getSiteName()
  const supportEmail = await getSupportEmail()

  const content = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 24px; font-weight: 700; text-align: center;">
      Loan Due Reminder 🔔
    </h2>

    <p style="color: #475569; font-size: 16px; line-height: 1.7; text-align: center;">
      The following book loan is due tomorrow:
    </p>

    <div style="background: #fef3c7; border: 2px dashed #fbbf24; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Loan Details
      </p>
      <div style="display: table; width: 100%; border-collapse: collapse;">
        <div style="display: table-row; border-bottom: 1px solid #fbbf24;">
          <div style="display: table-cell; padding: 10px 0; color: #64748b; font-size: 13px;">Book:</div>
          <div style="display: table-cell; padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${bookName}</div>
        </div>
        <div style="display: table-row; border-bottom: 1px solid #fbbf24;">
          <div style="display: table-cell; padding: 10px 0; color: #64748b; font-size: 13px;">Borrower:</div>
          <div style="display: table-cell; padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${userName}</div>
        </div>
        <div style="display: table-row; border-bottom: 1px solid #fbbf24;">
          <div style="display: table-cell; padding: 10px 0; color: #64748b; font-size: 13px;">Email:</div>
          <div style="display: table-cell; padding: 10px 0; color: #0f172a; font-size: 14px; text-align: right;">${userEmail}</div>
        </div>
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 10px 0; color: #64748b; font-size: 13px;">Due Date:</div>
          <div style="display: table-cell; padding: 10px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">${dueDate}</div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <a href="${BASE_URL}/dashboard/loans" class="button">Manage Loans</a>
    </div>
  `

  return {
    subject: `Loan Due Tomorrow: ${bookName}`,
    html: emailTemplateWrapper(content, 'Loan Due Reminder - Admin', appName, supportEmail)
  }
}

/**
 * GET /api/cron/loans/remind
 *
 * Check for loans due in 1 day and send reminder emails
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const urlSecret = new URL(request.url).searchParams.get('secret')

    const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate tomorrow's date range
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    // Find loans due tomorrow that haven't had reminders sent
    const loansDueTomorrow = await prisma.bookLoan.findMany({
      where: {
        status: { in: ['ACTIVE', 'OVERDUE'] },
        dueDate: {
          gte: tomorrow,
          lte: tomorrowEnd
        },
        reminderSent: false
      },
      include: {
        book: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, username: true } },
        lentBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    })

    if (loansDueTomorrow.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No loans due tomorrow',
        remindersSent: 0
      })
    }

    const dueDateStr = tomorrow.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    let successCount = 0
    const errors: string[] = []

    // Send reminders for each loan
    for (const loan of loansDueTomorrow) {
      try {
        const userName = getUserDisplayName({
          firstName: loan.user.firstName,
          lastName: loan.user.lastName,
          username: loan.user.username,
          name: '',
          email: loan.user.email
        })

        // Send email to user
        const userEmailTemplate = await getDueDateReminderEmailTemplate(
          userName,
          loan.book.name,
          dueDateStr
        )

        await resend.emails.send({
          from: FROM_EMAIL,
          to: loan.user.email,
          subject: userEmailTemplate.subject,
          html: userEmailTemplate.html,
        })

        // Send email to admin
        const adminEmailTemplate = await getAdminReminderEmailTemplate(
          userName,
          loan.book.name,
          dueDateStr,
          loan.user.email
        )

        await resend.emails.send({
          from: FROM_EMAIL,
          to: loan.lentBy.email,
          subject: adminEmailTemplate.subject,
          html: adminEmailTemplate.html,
        })

        // Mark reminder as sent
        await prisma.bookLoan.update({
          where: { id: loan.id },
          data: { reminderSent: true }
        })

        successCount++
      } catch (error) {
        console.error(`Failed to send reminder for loan ${loan.id}:`, error)
        errors.push(`Loan ${loan.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${loansDueTomorrow.length} loans due tomorrow`,
      remindersSent: successCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
