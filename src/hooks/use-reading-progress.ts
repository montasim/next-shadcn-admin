import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { calculateAverageProgress } from '@/lib/utils/reading-progress'

interface ReadingProgress {
  id?: string
  bookId: string
  currentPage?: number
  currentEpocha?: number // For audio books-old (position in seconds)
  progress: number // Percentage 0-100
  isCompleted: boolean
  lastReadAt?: string
  totalPages?: number
  totalDuration?: number
  readingTime?: number // Total reading time in minutes
}

interface ProgressUpdateData {
  bookId: string
  currentPage?: number
  currentEpocha?: number
  progress: number
  isCompleted: boolean
  totalPages?: number
  totalDuration?: number
  readingTime?: number
}

interface AutoSaveOptions {
  debounceMs?: number
  autoSave?: boolean
}

// API functions
const fetchReadingProgress = async (bookId: string): Promise<ReadingProgress | null> => {
  const response = await fetch(`/api/user/progress/${bookId}`)
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Failed to fetch reading progress')
  return response.json()
}

const updateReadingProgress = async (data: ProgressUpdateData): Promise<ReadingProgress> => {
  const response = await fetch('/api/user/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update reading progress')
  return response.json()
}

const getAllReadingProgress = async (): Promise<ReadingProgress[]> => {
  const response = await fetch('/api/user/progress')
  if (!response.ok) throw new Error('Failed to fetch reading progress')
  return response.json()
}

// Hook to get reading progress for a specific book
export function useReadingProgress(bookId: string) {
  return useQuery({
    queryKey: ['reading-progress', bookId],
    queryFn: () => fetchReadingProgress(bookId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!bookId,
  })
}

// Hook to get all reading progress
export function useAllReadingProgress() {
  return useQuery({
    queryKey: ['reading-progress', 'all'],
    queryFn: getAllReadingProgress,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook for updating reading progress with auto-save
export function useReadingProgressManager(
  bookId: string,
  options: AutoSaveOptions = { debounceMs: 5000, autoSave: true }
) {
  const queryClient = useQueryClient()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const pendingUpdateRef = useRef<ProgressUpdateData | null>(null)

  const mutation = useMutation({
    mutationFn: updateReadingProgress,
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(['reading-progress', bookId], data)
      queryClient.setQueryData(['reading-progress', 'all'], (old: ReadingProgress[] = []) => {
        const index = old.findIndex(p => p.bookId === bookId)
        if (index >= 0) {
          const updated = [...old]
          updated[index] = data
          return updated
        }
        return [...old, data]
      })
    },
    onError: (error) => {
      console.error('Failed to save reading progress:', error)
      // Retry failed update
      if (pendingUpdateRef.current) {
        setTimeout(() => {
          if (pendingUpdateRef.current) {
            mutation.mutate(pendingUpdateRef.current)
          }
        }, 10000) // Retry after 10 seconds
      }
    },
  })

  const saveProgress = useCallback(
    (progressData: Omit<ProgressUpdateData, 'bookId'>) => {
      const data: ProgressUpdateData = {
        bookId,
        ...progressData,
      }

      // Store pending update for retry
      pendingUpdateRef.current = data

      if (options.autoSave) {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Set new timeout for debounced save
        timeoutRef.current = setTimeout(() => {
          mutation.mutate(data)
          pendingUpdateRef.current = null
        }, options.debounceMs)
      }
    },
    [bookId, options.autoSave, options.debounceMs, mutation]
  )

  // Force save immediately
  const saveProgressImmediate = useCallback(
    (progressData: Omit<ProgressUpdateData, 'bookId'>) => {
      const data: ProgressUpdateData = {
        bookId,
        ...progressData,
      }

      // Clear any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      mutation.mutate(data)
      pendingUpdateRef.current = null
    },
    [bookId, mutation]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Save any pending progress
      if (pendingUpdateRef.current) {
        mutation.mutate(pendingUpdateRef.current)
      }
    }
  }, [mutation])

  return {
    saveProgress,
    saveProgressImmediate,
    isLoading: mutation.isLoading,
    error: mutation.error,
  }
}

// Hook for reading session tracking
export function useReadingSession(bookId: string, initialProgress?: ReadingProgress) {
  const sessionStartTime = useRef<number>(Date.now())
  const sessionReadingTime = useRef<number>(0)
  const lastActiveTime = useRef<number>(Date.now())
  const { saveProgressImmediate } = useReadingProgressManager(bookId, { autoSave: false })

  // Track reading time
  const trackReadingTime = useCallback(() => {
    const now = Date.now()
    const timeSinceLastActive = now - lastActiveTime.current

    // Only count if active within last 5 minutes
    if (timeSinceLastActive < 5 * 60 * 1000) {
      sessionReadingTime.current += timeSinceLastActive
    }

    lastActiveTime.current = now
  }, [])

  // End session and save
  const endSession = useCallback(
    (progressData: Omit<ProgressUpdateData, 'bookId'>) => {
      trackReadingTime()

      const sessionTimeMinutes = Math.round(sessionReadingTime.current / (1000 * 60))
      const totalReadingTime = (initialProgress?.readingTime || 0) + sessionTimeMinutes

      saveProgressImmediate({
        ...progressData,
        readingTime: totalReadingTime,
      })

      // Reset session tracking
      sessionStartTime.current = Date.now()
      sessionReadingTime.current = 0
      lastActiveTime.current = Date.now()
    },
    [trackReadingTime, saveProgressImmediate, initialProgress?.readingTime]
  )

  // Auto-track reading time
  useEffect(() => {
    const interval = setInterval(trackReadingTime, 60 * 1000) // Track every minute

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackReadingTime()
      } else {
        lastActiveTime.current = Date.now()
      }
    }

    // Handle page unload
    const handleBeforeUnload = () => {
      trackReadingTime()
      // Use sendBeacon for reliable final save
      if (navigator.sendBeacon && initialProgress) {
        const sessionTimeMinutes = Math.round(sessionReadingTime.current / (1000 * 60))
        const totalReadingTime = (initialProgress.readingTime || 0) + sessionTimeMinutes

        const data = new Blob([
          JSON.stringify({
            bookId,
            readingTime: totalReadingTime,
            lastReadAt: new Date().toISOString(),
          })
        ], { type: 'application/json' })

        navigator.sendBeacon('/api/user/progress/ping', data)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [trackReadingTime, bookId, initialProgress])

  return {
    endSession,
    getSessionReadingTime: () => Math.round(sessionReadingTime.current / (1000 * 60)),
  }
}

// Hook for calculating reading statistics
export function useReadingStats() {
  const { data: progressData = [] } = useAllReadingProgress()

  const stats = {
    totalBooks: progressData.length,
    completedBooks: progressData.filter(p => p.isCompleted).length,
    totalPagesRead: progressData.reduce((sum, p) => sum + (p.currentPage || 0), 0),
    totalReadingTime: progressData.reduce((sum, p) => sum + (p.readingTime || 0), 0),
    averageProgress: calculateAverageProgress(progressData.map(p => p.progress)),
  }

  return stats
}