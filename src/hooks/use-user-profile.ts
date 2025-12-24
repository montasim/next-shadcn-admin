import { useQuery } from '@tanstack/react-query'
import type { BookType } from '@prisma/client'

export interface UserProfile {
  id: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  name?: string
  avatar?: string | null
  bio?: string | null
  createdAt: string
}

export interface UserProfileStats {
  totalBooks: number
  totalReaders: number
}

export interface UserBook {
  id: string
  name: string
  type: BookType
  image?: string | null
  summary?: string | null
  requiresPremium: boolean
  entryDate: string
  pageNumber?: number | null
  readersCount: number
}

export interface UserBookshelf {
  id: string
  name: string
  description?: string | null
  image?: string | null
  bookCount: number
  books: Array<{
    id: string
    name: string
    type: BookType
    image?: string | null
    summary?: string | null
    requiresPremium: boolean
    pageNumber?: number | null
    readersCount: number
    addedAt: string
  }>
}

export interface HeatmapData {
  date: string
  pagesRead: number
  timeSpent: number
  level: number
}

export interface PagesReadData {
  date: string
  pagesRead: number
}

export interface UserReadingActivity {
  heatmap: HeatmapData[]
  pagesPerDay: PagesReadData[]
}

interface UserProfileResponse {
  success: boolean
  data: {
    user: UserProfile
    statistics: UserProfileStats
    books: UserBook[]
  }
}

interface UseUserProfileOptions {
  id: string
}

export function useUserProfile({ id }: UseUserProfileOptions) {
  return useQuery({
    queryKey: ['user-profile', id],
    queryFn: async (): Promise<UserProfileResponse> => {
      const response = await fetch(`/api/public/users/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch user profile' }))
        throw new Error(error.message || 'Failed to fetch user profile')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

interface UserBookshelvesResponse {
  success: boolean
  data: {
    bookshelves: UserBookshelf[]
    totalBookshelves: number
  }
}

export function useUserBookshelves({ id }: { id: string }) {
  return useQuery({
    queryKey: ['user-bookshelves', id],
    queryFn: async (): Promise<UserBookshelvesResponse> => {
      const response = await fetch(`/api/public/users/${id}/bookshelves`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch user bookshelves' }))
        throw new Error(error.message || 'Failed to fetch user bookshelves')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

interface UserReadingActivityResponse {
  success: boolean
  data: UserReadingActivity
}

export function useUserReadingActivity({ id }: { id: string }) {
  return useQuery({
    queryKey: ['user-reading-activity', id],
    queryFn: async (): Promise<UserReadingActivityResponse> => {
      const response = await fetch(`/api/public/users/${id}/reading-activity`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch reading activity' }))
        throw new Error(error.message || 'Failed to fetch reading activity')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
