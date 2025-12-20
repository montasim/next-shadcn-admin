'use client'

import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconBrandFacebook, IconBrandGithub } from '@tabler/icons-react'
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

import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useEffect } from 'react'

type SignUpFormProps = HTMLAttributes<HTMLDivElement>

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

// Step 3: Account details
const detailsSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Please enter your name' })
      .max(100, { message: 'Name must be less than 100 characters' }),
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

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp' | 'details'>('email')
  const [email, setEmail] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<string>('')

  // Get prefilled email from query parameter
  const prefilledEmail = searchParams?.get('email') || ''

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: prefilledEmail },
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const detailsForm = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Step 1: Send OTP
  async function onEmailSubmit(data: z.infer<typeof emailSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send OTP',
        })
        return
      }

      setEmail(data.email)
      setOtpExpiresAt(result.expiresAt)
      setStep('otp')

      toast({
        title: 'OTP Sent',
        description: 'Check your email for the verification code',
      })
    } catch (error) {
      console.error('Send OTP error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-submit if email is prefilled
  useEffect(() => {
    if (prefilledEmail && !isLoading) {
      setEmail(prefilledEmail)
      // Auto-submit to send OTP
      onEmailSubmit({ email: prefilledEmail })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledEmail])

  // Step 2: Verify OTP
  async function onOtpSubmit(data: z.infer<typeof otpSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Invalid OTP',
          description: result.error || 'Please check your code and try again',
        })
        return
      }

      setStep('details')

      toast({
        title: 'Verified',
        description: 'Please complete your account details',
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

  // Step 3: Create Account
  async function onDetailsSubmit(data: z.infer<typeof detailsSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: data.name,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: result.error || 'Failed to create account',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Account created successfully',
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Create account error:', error)
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
                {isLoading ? 'Sending...' : 'Continue'}
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
                    <FormLabel>Verification Code</FormLabel>
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
                {isLoading ? 'Verifying...' : 'Verify'}
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

  // Render Step 3: Account Details
  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...detailsForm}>
        <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={detailsForm.control}
              name='name'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='John Doe' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={detailsForm.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={detailsForm.control}
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
