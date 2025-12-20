'use client'

import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

type ForgotFormProps = HTMLAttributes<HTMLDivElement>

// Step 1: Email input
const emailSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
})

// Step 2: OTP input
const otpSchema = z.object({
  otp: z
    .string()
    .min(7, { message: 'OTP must be 7 digits' })
    .max(7, { message: 'OTP must be 7 digits' })
    .regex(/^\d+$/, { message: 'OTP must contain only numbers' }),
})

// Step 3: New password
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain a number' })
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        { message: 'Password must contain a special character' }
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function ForgotForm({ className, ...props }: ForgotFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Step 1: Send Reset OTP
  async function onEmailSubmit(data: z.infer<typeof emailSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send reset code',
        })
        return
      }

      setEmail(data.email)
      setStep('otp')

      toast({
        title: 'Reset Code Sent',
        description: result.message || 'Check your email for the reset code',
      })
    } catch (error) {
      console.error('Send reset OTP error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP
  async function onOtpSubmit(data: z.infer<typeof otpSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Invalid Code',
          description: result.error || 'Please check your code and try again',
        })
        return
      }

      setStep('password')

      toast({
        title: 'Verified',
        description: 'Please enter your new password',
      })
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Set New Password
  async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to reset password',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Password reset successfully. Please login with your new password.',
      })

      router.push('/auth/sign-in')
    } catch (error) {
      console.error('Reset password error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Render Step 1: Email Input
  if (step === 'email') {
    return (
      <div className={cn('grid gap-6', className)} {...props}>
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className='grid gap-2'>
              <FormField
                control={emailForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='name@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='mt-2' disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  // Render Step 2: OTP Verification
  if (step === 'otp') {
    return (
      <div className={cn('grid gap-6', className)} {...props}>
        <div className='mb-4'>
          <p className='text-sm text-muted-foreground'>
            We sent a 7-digit code to <strong>{email}</strong>
          </p>
        </div>
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
            <div className='grid gap-2'>
              <FormField
                control={otpForm.control}
                name='otp'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Reset Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='1234567'
                        maxLength={7}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='mt-2' disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setStep('email')}
                className='mt-2'
              >
                Back to Email
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  // Render Step 3: New Password
  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={passwordForm.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
