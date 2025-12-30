"use client"

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'

// Custom debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

import { updateProfile, checkUsernameAvailability, checkEmailAvailability, sendEmailChangeOtp, verifyEmailChangeOtp } from './actions'
import { type ProfileFormValues, profileFormSchema } from './schema'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, X, Mail, Trash2 } from 'lucide-react'
import { OtpInput, ResendButton } from '@/components/ui/otp-input'
import { Card, CardContent } from '@/components/ui/card'

interface ProfileFormClientProps {
  defaultValues: Partial<ProfileFormValues>
}

export function ProfileFormClient({ defaultValues }: ProfileFormClientProps) {
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [originalEmail, setOriginalEmail] = useState(defaultValues.email || '')
  const [originalUsername, setOriginalUsername] = useState(defaultValues.username || '')

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: defaultValues.username || '',
      email: defaultValues.email || '',
      bio: defaultValues.bio || '',
      urls: defaultValues.urls || [],
    },
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  // Debounced username availability check
  const debouncedUsernameCheck = useMemo(
    () =>
      debounce(async (username: string) => {
        if (!username || username.length < 2) {
          setUsernameAvailable(null)
          return
        }

        setIsCheckingUsername(true)
        try {
          const result = await checkUsernameAvailability(username)
          setUsernameAvailable(result)
        } catch (error) {
          setUsernameAvailable(null)
        } finally {
          setIsCheckingUsername(false)
        }
      }, 500),
    []
  )

  // Debounced email availability check
  const debouncedEmailCheck = useMemo(
    () =>
      debounce(async (email: string) => {
        if (!email || !email.includes('@')) {
          setEmailAvailable(null)
          return
        }

        setIsCheckingEmail(true)
        try {
          const result = await checkEmailAvailability(email)
          setEmailAvailable(result)
        } catch (error) {
          setEmailAvailable(null)
        } finally {
          setIsCheckingEmail(false)
        }
      }, 500),
    []
  )

  // Watch username and email changes
  const username = form.watch('username')
  const email = form.watch('email')

  useEffect(() => {
    if (username && username.length >= 2 && username !== originalUsername) {
      debouncedUsernameCheck(username)
    } else {
      setUsernameAvailable(null)
    }
  }, [username, originalUsername, debouncedUsernameCheck])

  useEffect(() => {
    const emailChanged = email !== originalEmail
    if (emailChanged) {
      debouncedEmailCheck(email)
      setShowOtpInput(false)
      setEmailVerified(false)
      setOtpError('')
    } else {
      setEmailAvailable(null)
      setShowOtpInput(false)
      setEmailVerified(true) // Original email is considered verified
    }
  }, [email, originalEmail, debouncedEmailCheck])

  const handleSendOtp = async () => {
    if (!email || email === originalEmail) return

    setIsSendingOtp(true)
    setOtpError('')
    try {
      const result = await sendEmailChangeOtp(email)
      if (result.success) {
        setShowOtpInput(true)
        toast({
          title: 'Verification code sent',
          description: `A 6-digit code has been sent to ${email}`,
        })
      } else {
        setOtpError(result.message)
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      setOtpError('Failed to send verification code')
      toast({
        title: 'Error',
        description: 'Failed to send verification code',
        variant: 'destructive',
      })
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (otpCode: string) => {
    if (!otpCode || !email) return

    setIsVerifyingOtp(true)
    setOtpError('')
    try {
      const result = await verifyEmailChangeOtp(email, otpCode)
      if (result.success) {
        setEmailVerified(true)
        setShowOtpInput(false)
        setOriginalEmail(email) // Update original email after successful verification
        toast({
          title: 'Email verified',
          description: 'Your email has been updated successfully',
        })
      } else {
        setOtpError(result.message)
      }
    } catch (error) {
      setOtpError('Failed to verify code')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    const result = await updateProfile(data)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: result.message,
    })

    // Update original values if changed successfully
    setOriginalEmail(data.email)
    if (data.username && data.username !== originalUsername) {
      setOriginalUsername(data.username)
    }
  }

  const emailChanged = email !== originalEmail
  const usernameChanged = username !== originalUsername
  const bioChanged = form.watch('bio') !== (defaultValues.bio || '')
  const urlsChanged = JSON.stringify(form.watch('urls')) !== JSON.stringify(defaultValues.urls || [])

  const hasChanges = usernameChanged || emailChanged || bioChanged || urlsChanged
  const isFormValid = form.formState.isValid
  const emailChangeValid = !emailChanged || (emailVerified && emailAvailable !== false)

  // Check if any fields have validation errors
  const hasValidationErrors = Object.keys(form.formState.errors).length > 0
  const isSubmitting = form.formState.isSubmitting

  const shouldDisableSubmit = !hasChanges || !isFormValid || hasValidationErrors || !emailChangeValid || isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <div className='relative'>
                  <Input placeholder='shadcn' {...field} />
                  {isCheckingUsername && (
                    <Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground' />
                  )}
                  {!isCheckingUsername && usernameAvailable !== null && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      {usernameAvailable ? (
                        <Check className='h-4 w-4 text-green-500' />
                      ) : (
                        <X className='h-4 w-4 text-red-500' />
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
                {usernameAvailable === false && (
                  <span className='text-red-500'> Username is already taken.</span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className='space-y-3'>
                  <div className='relative'>
                    <Input placeholder='email@example.com' {...field} />
                    {isCheckingEmail && (
                      <Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground' />
                    )}
                    {!isCheckingEmail && emailAvailable !== null && emailChanged && (
                      <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                        {emailAvailable ? (
                          <Check className='h-4 w-4 text-green-500' />
                        ) : (
                          <X className='h-4 w-4 text-red-500' />
                        )}
                      </div>
                    )}
                  </div>

                  {emailChanged && emailAvailable && !showOtpInput && !emailVerified && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className='w-full'
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className='mr-2 h-4 w-4' />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  )}

                  {showOtpInput && (
                    <Card className={cn('border-2', otpError ? 'border-red-500' : 'border-indigo-500')}>
                      <CardContent className='pt-6 space-y-4'>
                        <div className='space-y-2'>
                          <h3 className='font-semibold text-center'>Enter verification code</h3>
                          <p className='text-sm text-muted-foreground text-center'>
                            We've sent a 6-digit code to <span className='font-medium text-foreground'>{email}</span>
                          </p>
                        </div>

                        <div className='flex justify-center'>
                          <OtpInput
                            length={6}
                            onComplete={handleVerifyOtp}
                            error={!!otpError}
                            disabled={isVerifyingOtp}
                          />
                        </div>

                        {otpError && (
                          <p className='text-sm text-red-600 text-center'>{otpError}</p>
                        )}

                        <ResendButton
                          onResend={handleSendOtp}
                          isResending={isSendingOtp}
                          cooldown={60}
                        />

                        {isVerifyingOtp && (
                          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                            <Loader2 className='h-4 w-4 animate-spin' />
                            Verifying code...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {emailVerified && emailChanged && (
                    <div className='flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg'>
                      <Check className='mr-2 h-4 w-4 text-green-600' />
                      <span className='text-sm text-green-700 font-medium'>Email verified successfully</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {emailChanged ? (
                  <>
                    {emailAvailable === false && (
                      <span className='text-red-500'>Email is already in use.</span>
                    )}
                    {emailAvailable === true && !emailVerified && (
                      <span>Please send and verify a code to confirm your new email address.</span>
                    )}
                  </>
                ) : (
                  'Your current email address'
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='bio'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Tell us a little bit about yourself'
                  className='resize-none'
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can <span>@mention</span> other users and organizations to
                link to them.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`urls.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(index !== 0 && 'sr-only')}>
                    URLs
                  </FormLabel>
                  <FormDescription className={cn(index !== 0 && 'sr-only')}>
                    Add links to your website, blog, or social media profiles.
                  </FormDescription>
                  <FormControl>
                    <div className='flex gap-2'>
                      <Input {...field} placeholder='https://example.com' />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => remove(index)}
                        className='shrink-0'
                        title='Remove URL'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='mt-2'
            onClick={() => append({ value: '' })}
          >
            Add URL
          </Button>
        </div>

        <Button
          type='submit'
          disabled={shouldDisableSubmit}
        >
          {isSubmitting ? 'Updating...' : hasChanges ? 'Update profile' : 'No changes made'}
        </Button>
      </form>
    </Form>
  )
}