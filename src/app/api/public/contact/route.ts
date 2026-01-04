import { NextRequest, NextResponse } from 'next/server'
import { sendContactFormEmail } from '@/lib/auth/email'
import { z } from 'zod'

/**
 * POST /api/public/contact
 * Submit contact form and send email to admin
 */

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().max(200, 'Subject is too long').optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = contactFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, email, subject, message } = validationResult.data

    // Send the email
    const result = await sendContactFormEmail(name, email, subject || '', message)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send message. Please try again later.',
          error: result.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We\'ll get back to you soon.',
    })
  } catch (error: any) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request.',
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
