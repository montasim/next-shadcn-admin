'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { UserAuthForm } from '../components/user-auth-form'
import { ROUTES } from '@/lib/routes/client-routes'

export default function SignIn() {
    const [authStep, setAuthStep] = useState<'email' | 'password'>('email')
    const [userEmail, setUserEmail] = useState('')

    const handleStepChange = (step: 'email' | 'password', email?: string) => {
        setAuthStep(step)
        if (email) setUserEmail(email)
    }

    return (
        <Card className='m-4 p-4'>
            <div className='flex flex-col space-y-2 text-left mb-4'>
                <h1 className='text-xl font-semibold tracking-tight'>
                    {authStep === 'email' ? 'Login' : 'Welcome back'}
                </h1>
                <p className='text-sm text-muted-foreground'>
                    {authStep === 'email' ? (
                        <>
                            Enter your email to continue <br />
                            We&apos;ll guide you through the sign-in process
                        </>
                    ) : (
                        <>
                            Enter your password to continue <br />
                            Welcome back, <strong>{userEmail}</strong>
                        </>
                    )}
                </p>
            </div>
            <UserAuthForm onStepChange={handleStepChange} />
            <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
                By clicking login, you agree to our{' '}
                <a
                    href={ROUTES.terms.href}
                    className='underline underline-offset-4 hover:text-primary'
                >
                    Terms of Service
                </a>{' '}
                and{' '}
                <a
                    href={ROUTES.privacy.href}
                    className='underline underline-offset-4 hover:text-primary'
                >
                    Privacy Policy
                </a>
                .
            </p>
        </Card>
    )
}