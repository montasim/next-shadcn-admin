'use client'

import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
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

import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement> & {
  onStepChange?: (step: 'email' | 'password', email?: string) => void
}

// Step 1: Email validation schema
const emailSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
})

// Step 2: Password validation schema
const passwordSchema = z.object({
  password: z
    .string()
    .min(1, {
      message: 'Please enter your password',
    }),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  })

  // Step 1: Check if email exists
  async function onEmailSubmit(data: z.infer<typeof emailSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to check email',
        })
        return
      }

      if (result.exists) {
        // Email exists - proceed to password step
        setEmail(data.email)
        setStep('password')
        props.onStepChange?.('password', data.email)
        toast({
          title: 'Email found',
          description: 'Please enter your password',
        })
      } else {
        // Email doesn't exist - redirect to sign-up with pre-filled email
        toast({
          title: 'Email not found',
          description: 'Redirecting to sign-up...',
        })
        // Redirect to sign-up with email as query parameter
        router.push(`/sign-up?email=${encodeURIComponent(data.email)}`)
      }
    } catch (error) {
      console.error('Check email error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Login with password
  async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: result.error || 'Invalid password',
        })
        return
      }

      // Success - show success message and redirect to dashboard
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const goBackToEmail = () => {
    setStep('email')
    props.onStepChange?.('email')
    passwordForm.reset()
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
                {isLoading ? 'Checking...' : 'Continue'}
              </Button>

              <div className='relative my-2'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background px-2 text-muted-foreground'>
                    Or continue with
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  className='w-full'
                  type='button'
                  disabled={isLoading}
                >
                  <IconBrandGithub className='h-4 w-4' /> GitHub
                </Button>
                <Button
                  variant='outline'
                  className='w-full'
                  type='button'
                  disabled={isLoading}
                >
                  <IconBrandFacebook className='h-4 w-4' /> Facebook
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  // Render Step 2: Password Input
  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <div className='mb-4 sr-only'>
        <p className='text-sm text-muted-foreground'>
          Welcome back, <strong>{email}</strong>
        </p>
      </div>
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
          <div className='grid gap-2'>
            <FormField
              control={passwordForm.control}
              name='password'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Password</FormLabel>
                    <Link
                      href='/forgot-password'
                      className='text-sm font-medium text-muted-foreground hover:opacity-75'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder='Enter your password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              onClick={goBackToEmail}
              className='mt-2'
            >
              Back to email
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
