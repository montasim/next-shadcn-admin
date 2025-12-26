import { useQuery } from '@tanstack/react-query'
import { Book } from './use-book'

export interface Author {
  id: string
  name: string
  description: string | null
  image: string | null
  directImageUrl: string | null
  entryDate: string
  entryBy: {
    id: string
    firstName: string
    lastName: string | null
    username: string | null
    name: string
    avatar: string | null
    bio: string | null
  } | null
  books: Book[]
  statistics: {
    totalBooks: number
    totalReaders: number
  }
  analytics?: {
    totalViews: number
  }
}

export interface AuthorDetailResponse {
  success: boolean
  data: {
    author: Author
  }
  message: string
}

interface UseAuthorOptions {
  id: string
}

export function useAuthor({ id }: UseAuthorOptions) {
  return useQuery({
    queryKey: ['author', id],
    queryFn: async (): Promise<AuthorDetailResponse> => {
      const response = await fetch(`/api/public/authors/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch author' }))
        throw new Error(error.message || 'Failed to fetch author details')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
