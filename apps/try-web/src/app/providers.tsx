'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { NotificationPrompt } from '@/components/NotificationPrompt'
import { usePageTracking } from '@/hooks/usePageTracking'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <PageTrackingWrapper />
      <NotificationPrompt />
      {children}
    </QueryClientProvider>
  )
}

function PageTrackingWrapper() {
  usePageTracking()
  return null
}
