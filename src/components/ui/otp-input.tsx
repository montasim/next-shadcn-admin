'use client'

import { forwardRef, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface OtpInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  length?: number
  onComplete?: (code: string) => void
  error?: boolean
  disabled?: boolean
}

/**
 * Industry-standard OTP Input Component
 *
 * Features:
 * - Individual digit inputs with auto-focus
 * - Auto-advance to next input on digit entry
 * - Backspace support to go to previous input
 * - Paste support for full OTP code
 * - Keyboard navigation (arrow keys, home, end)
 * - Accessibility support
 */
export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(
  ({ length = 6, onComplete, error, disabled, className, ...props }, ref) => {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [isFocused, setIsFocused] = useState(new Array(length).fill(false))

    // Focus first input on mount
    useEffect(() => {
      if (inputRefs.current[0] && !disabled) {
        inputRefs.current[0]?.focus()
      }
    }, [])

    const handleChange = (index: number, value: string) => {
      // Only allow digits
      if (!/^\d*$/.test(value)) return

      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-advance to next input
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }

      // Check if complete
      const code = newOtp.join('')
      if (code.length === length && onComplete) {
        onComplete(code)
      }
    }

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      // Handle backspace
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }

      // Handle arrow keys
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault()
        inputRefs.current[index - 1]?.focus()
      }
      if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault()
        inputRefs.current[index + 1]?.focus()
      }

      // Handle home
      if (e.key === 'Home') {
        e.preventDefault()
        inputRefs.current[0]?.focus()
      }

      // Handle end
      if (e.key === 'End') {
        e.preventDefault()
        inputRefs.current[length - 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData('text/plain').trim()

      // Check if pasted content is all digits
      if (!/^\d+$/.test(pastedData)) return

      const digits = pastedData.slice(0, length).split('')
      const newOtp = [...digits, ...new Array(length - digits.length).fill('')]
      setOtp(newOtp)

      // Focus the next empty input or the last one
      const nextIndex = Math.min(digits.length, length - 1)
      inputRefs.current[nextIndex]?.focus()

      // Check if complete
      const code = newOtp.join('')
      if (code.length === length && onComplete) {
        onComplete(code)
      }
    }

    const handleFocus = (index: number) => {
      const newFocused = new Array(length).fill(false)
      newFocused[index] = true
      setIsFocused(newFocused)
    }

    const handleBlur = (index: number) => {
      const newFocused = [...isFocused]
      newFocused[index] = false
      setIsFocused(newFocused)
    }

    // Expose a method to get the current OTP value via ref
    useEffect(() => {
      if (typeof ref === 'function' || !ref) return

      (ref as any).current = {
        value: otp.join(''),
        reset: () => {
          setOtp(new Array(length).fill(''))
          inputRefs.current[0]?.focus()
        },
        focus: () => inputRefs.current[0]?.focus()
      }
    }, [otp, ref, length])

    return (
      <div className={cn('flex flex-wrap items-center justify-center gap-1.5 sm:gap-2', className)}>
        {Array.from({ length }).map((_, index) => (
          <div key={index} className="relative">
            <input
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={otp[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => handleFocus(index)}
              onBlur={() => handleBlur(index)}
              disabled={disabled}
              className={cn(
                'w-9 h-12 sm:w-10 sm:h-14 text-center text-xl font-bold',
                'bg-muted rounded-lg',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                // Disabled state
                'disabled:opacity-50 disabled:cursor-not-allowed',
                // Error state
                error
                  ? 'ring-2 ring-red-500 focus:ring-red-500'
                  : '',
                // Focus state
                isFocused[index] && !error && '',
                // Autofill background
                'autofill:bg-transparent'
              )}
              {...props}
            />
            {/* Focus indicator */}
            <div
              className={cn(
                'absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-200',
                isFocused[index] && !error
                  ? 'bg-indigo-500 scale-x-100'
                  : 'bg-transparent scale-x-0'
              )}
            />
          </div>
        ))}
      </div>
    )
  }
)

OtpInput.displayName = 'OtpInput'

/**
 * Resend OTP Button with Timer
 */
interface ResendButtonProps {
  onResend: () => void
  isResending: boolean
  cooldown?: number // in seconds
}

export function ResendButton({ onResend, isResending, cooldown = 60 }: ResendButtonProps) {
  const [timeLeft, setTimeLeft] = useState(cooldown)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleResend = () => {
    if (canResend && !isResending) {
      onResend()
      setTimeLeft(cooldown)
      setCanResend(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {!canResend ? (
        <p className="text-sm text-muted-foreground">
          Didn't receive the code? Resend in <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className={cn(
            'text-sm font-medium',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:underline'
          )}
        >
          {isResending ? 'Sending...' : 'Resend code'}
        </button>
      )}
    </div>
  )
}

/**
 * Complete OTP Form Component
 */
interface OtpFormProps {
  length?: number
  onSubmit: (code: string) => void
  onResend: () => void
  isSubmitting?: boolean
  isResending?: boolean
  error?: string
  email?: string
  title?: string
  description?: string
  submitText?: string
  cooldown?: number
}

export function OtpForm({
  length = 6,
  onSubmit,
  onResend,
  isSubmitting = false,
  isResending = false,
  error,
  email,
  title = 'Enter verification code',
  description = 'Please enter the 6-digit code sent to your email',
  submitText = 'Verify',
  cooldown = 60,
}: OtpFormProps) {
  const [code, setCode] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const handleComplete = (otpCode: string) => {
    setCode(otpCode)
    setIsComplete(true)
    onSubmit(otpCode)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length === length) {
      onSubmit(code)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {description}
          {email && (
            <span className="block mt-1 font-medium">
              Code sent to <span className="text-foreground">{email}</span>
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <OtpInput
          length={length}
          onComplete={handleComplete}
          error={!!error}
          disabled={isSubmitting}
        />

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!isComplete || isSubmitting}
          className={cn(
            'w-full max-w-xs px-8 py-3',
            'bg-indigo-600 hover:bg-indigo-700',
            'text-white font-medium rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12V0a7.962 7.962 0 00-4 5.291z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            submitText
          )}
        </button>

        <ResendButton
          onResend={onResend}
          isResending={isResending}
          cooldown={cooldown}
        />
      </div>
    </form>
  )
}
