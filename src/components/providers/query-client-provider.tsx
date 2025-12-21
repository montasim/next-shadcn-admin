'use client'

import { QueryClient, QueryClientProvider as BaseQueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function AppQueryClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && 'status' in error) {
                const status = (error as any).status
                return failureCount < 3 && status >= 500
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <BaseQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </BaseQueryClientProvider>
  )
}