import { useQuery } from '@tanstack/react-query'
import { Book } from './use-book'

export interface Publication {
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

export interface PublicationDetailResponse {
  success: boolean
  data: {
    publication: Publication
  }
  message: string
}

interface UsePublicationOptions {
  id: string
}

export function usePublication({ id }: UsePublicationOptions) {
  return useQuery({
    queryKey: ['publication', id],
    queryFn: async (): Promise<PublicationDetailResponse> => {
      const response = await fetch(`/api/public/publications/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch publication' }))
        throw new Error(error.message || 'Failed to fetch publication details')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
