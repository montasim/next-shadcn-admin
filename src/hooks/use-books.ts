import { useQuery } from '@tanstack/react-query'
import type { BookType } from '@prisma/client'

interface BookFilters {
  page?: number
  limit?: number
  search?: string
  type?: string
  category?: string
  author?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  premium?: 'all' | 'free' | 'premium'
}

export interface BookUploader {
  id: string
  username?: string | null
  firstName?: string | null
  lastName?: string | null
  name?: string
  avatar?: string | null
}

export interface Book {
  id: string
  name: string
  summary?: string
  type: BookType
  image?: string
  requiresPremium: boolean
  canAccess: boolean
  authors: Array<{
    id: string
    name: string
  }>
  categories: Array<{
    id: string
    name: string
  }>
  fileUrl?: string
  readersCount?: number
  pageNumber?: number | null
  progress?: {
    currentPage?: number
    progress: number
    isCompleted?: boolean
  }
  entryBy?: BookUploader | null
}

interface BooksResponse {
  books: Book[]
  pagination: {
    currentPage: number
    totalPages: number
    totalBooks: number
    limit: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function useBooks(filters: BookFilters = {}) {
  const queryParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  return useQuery({
    queryKey: ['books', filters],
    queryFn: async (): Promise<BooksResponse> => {
      const response = await fetch(`/api/public/books?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch books')
      }
      const json = await response.json()
      // Unwrap the response - API returns { success, data: { books, pagination } }
      return json.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}