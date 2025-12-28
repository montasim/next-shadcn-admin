import { useQuery } from '@tanstack/react-query'

export interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  entryDate: string
  bookCount: number
}

export interface CategoriesResponse {
  success: boolean
  data: {
    categories: Category[]
    pagination: {
      currentPage: number
      totalPages: number
      totalCategories: number
      limit: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
  message: string
}

interface UseCategoriesOptions {
  limit?: number
  minBooks?: number
  enabled?: boolean
}

export function useCategories({ limit = 20, minBooks = 1, enabled = true }: UseCategoriesOptions = {}) {
  return useQuery({
    queryKey: ['categories', { limit, minBooks }],
    queryFn: async (): Promise<CategoriesResponse> => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        minBooks: minBooks.toString(),
      })

      const response = await fetch(`/api/public/categories?${params}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch categories' }))
        throw new Error(error.message || 'Failed to fetch categories')
      }
      return response.json()
    },
    enabled,
    retry: 1,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}
