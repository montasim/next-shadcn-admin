'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import AuthLayout from '@/components/auth-layout'
import { SignUpForm } from './components/sign-up-form'

export default function SignUp() {
    return (
        <AuthLayout>
            <Card className='p-6'>
                <SignUpForm />
                <p className='mt-4 px-8 text-center text-sm text-muted-foreground'>
                    By creating an account, you agree to our{' '}
                    <Link
                        href='/terms'
                        className='underline underline-offset-4 hover:text-primary'
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        href='/privacy'
                        className='underline underline-offset-4 hover:text-primary'
                    >
                        Privacy Policy
                    </Link>
                    .
                </p>
            </Card>
        </AuthLayout>
    )
}