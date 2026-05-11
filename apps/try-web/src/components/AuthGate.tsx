'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import LandingPage from '@/app/landing/page'

const PUBLIC_PATHS = ['/landing', '/login', '/register']

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')

    const authenticated = !!token && !!user
    setIsAuthenticated(authenticated)
    setIsLoading(false)

    // Redirect logic
    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))

    if (!authenticated && !isPublicPath) {
      // Not logged in and trying to access protected route
      router.push('/landing')
    } else if (authenticated && isPublicPath) {
      // Logged in and on public path
      router.push('/')
    }
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for unauthenticated users on protected routes
  const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path))
  if (!isAuthenticated && !isPublicPath) {
    return <LandingPage />
  }

  return <>{children}</>
}

// Hook to check auth status
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    setIsAuthenticated(!!token)
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        setUser(null)
      }
    }
  }, [])

  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, login, logout }
}
