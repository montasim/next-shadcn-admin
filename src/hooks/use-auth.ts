'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    email: string
    name: string
    firstName?: string
    lastName?: string
    username?: string
    createdAt: string
    updatedAt: string
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const fetchUser = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/auth/me')
            const result = await response.json()

            if (response.ok && result.success) {
                setUser(result.admin)
            } else {
                setUser(null)
                setError(result.error || 'Failed to fetch user')
            }
        } catch (err) {
            setError('An error occurred while fetching user data')
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            })

            if (response.ok) {
                router.push('/auth/sign-in')
                router.refresh()
            }
        } catch (err) {
            console.error('Logout error:', err)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    return {
        user,
        isLoading,
        error,
        logout,
        refreshUser: fetchUser,
    }
}
