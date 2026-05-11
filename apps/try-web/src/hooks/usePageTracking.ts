'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'

export function usePageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    analytics.pageView(pathname)
  }, [pathname])
}
