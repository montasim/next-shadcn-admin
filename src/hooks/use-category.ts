import { useQuery } from '@tanstack/react-query'
import { Book } from './use-book'

export interface Category {
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

export interface CategoryDetailResponse {
  success: boolean
  data: {
    category: Category
  }
  message: string
}

interface UseCategoryOptions {
  id: string
}

export function useCategory({ id }: UseCategoryOptions) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async (): Promise<CategoryDetailResponse> => {
      const response = await fetch(`/api/public/categories/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch category' }))
        throw new Error(error.message || 'Failed to fetch category details')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
