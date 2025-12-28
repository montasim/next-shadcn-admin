import { useQuery } from '@tanstack/react-query'

export interface Author {
  id: string
  name: string
  description?: string | null
  image?: string | null
}

export interface Category {
  id: string
  name: string
  description?: string | null
  image?: string | null
}

export interface Publication {
  id: string
  name: string
  description?: string | null
  image?: string | null
}

export interface BookUser {
  id: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  name?: string
  avatar?: string | null
  bio?: string | null
  createdAt?: string
}

export interface ReadingProgress {
  id?: string
  currentPage?: number | null
  currentEpocha?: number | null
  progress: number
  isCompleted?: boolean
  lastReadAt?: string | null
}

export interface RecommendationReason {
  authors: string[]
  publications: string[]
  categories: string[]
}

export interface Series {
  seriesId: string
  seriesName: string
  seriesDescription?: string | null
  seriesImage?: string | null
  order: number
  totalBooks: number
  previousBook: SeriesBook | null
  nextBook: SeriesBook | null
}

export interface SeriesBook {
  id: string
  name: string
  image?: string | null
  type: 'HARD_COPY' | 'EBOOK' | 'AUDIO'
  requiresPremium: boolean
  canAccess: boolean
}

export interface Book {
  id: string
  name: string
  summary?: string | null
  type: 'HARD_COPY' | 'EBOOK' | 'AUDIO'
  bindingType?: 'HARDCOVER' | 'PAPERBACK' | null
  pageNumber?: number | null
  buyingPrice?: number | null
  sellingPrice?: number | null
  numberOfCopies?: number | null
  purchaseDate?: string | null
  entryDate?: string
  image?: string | null
  fileUrl?: string | null
  directFileUrl?: string | null
  aiSummary?: string | null
  aiSummaryGeneratedAt?: string | null
  aiSummaryStatus?: string | null
  suggestedQuestions?: Array<{
    id: string
    question: string
    answer: string
    order: number
  }> | null
  questionsStatus?: string | null
  requiresPremium: boolean
  canAccess: boolean
  authors: Author[]
  categories: Category[]
  publications?: Publication[]
  series?: Series[]
  readingProgress?: ReadingProgress | null
  progress?: {
    currentPage?: number
    progress: number
    isCompleted?: boolean
  }
  statistics?: {
    totalReaders: number
    avgProgress: number
  }
  analytics?: {
    totalViews: number
  }
  relatedBooks?: Book[]
  recommendationReasons?: Record<string, RecommendationReason>
  entryBy?: string | BookUploader | BookUser | null
}

export interface BookUploader {
  id: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  name?: string
  avatar?: string | null
  bio?: string | null
  createdAt?: string
}

export interface UserAccess {
  isAuthenticated: boolean
  hasPremium: boolean
  canAccess: boolean
  canRead: boolean
}

interface BookDetailResponse {
  success: boolean
  data: {
    book: Book
    userAccess: UserAccess
  }
  message: string
}

interface UseBookOptions {
  id: string
}

export function useBook({ id }: UseBookOptions) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: async (): Promise<BookDetailResponse> => {
      const response = await fetch(`/api/public/books/${id}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to fetch book' }))
        throw new Error(error.message || 'Failed to fetch book details')
      }
      return response.json()
    },
    enabled: !!id,
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
