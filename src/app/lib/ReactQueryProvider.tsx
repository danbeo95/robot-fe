'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export interface ReactQueryProviderProps {
  children: React.ReactNode
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000, // 5 seconds
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default ReactQueryProvider
