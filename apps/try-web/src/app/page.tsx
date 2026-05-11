'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'
import { TrialCard } from '@/components/TrialCard'
import { SurpriseCard } from '@/components/SurpriseCard'
import { BundlesUpsell } from '@/components/BundlesUpsell'
import { CategoryFilter } from '@/components/CategoryFilter'
import { Loader2 } from 'lucide-react'
import LandingPage from '@/app/landing/page'

export default function HomePage() {
  const router = useRouter()
  const [category, setCategory] = useState('all')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check auth status
  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const auth = !!(token && user)
    setIsAuthenticated(auth)
    setIsCheckingAuth(false)

    // If not authenticated, stay on landing page
    if (!auth) {
      // Will show landing page below
    }
  }, [])

  // Get user location
  useEffect(() => {
    if (!isAuthenticated) return // Skip if not authenticated

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 19.076, lng: 72.877 }) // Default to Mumbai
      )
    } else {
      setLocation({ lat: 19.076, lng: 72.877 })
    }
  }, [isAuthenticated])

  // Fetch trials
  const { data: trials = [], isLoading } = useQuery({
    queryKey: ['trials', location],
    queryFn: () => tryApi.getFeed(location?.lat || 0, location?.lng || 0),
    enabled: !!location && isAuthenticated,
  })

  // Filter trials
  const filteredTrials = category === 'all'
    ? trials
    : trials.filter((t: any) => t.category.toLowerCase() === category.toLowerCase())

  // Get user data for conditional rendering
  const { data: coins } = useQuery({
    queryKey: ['coins'],
    queryFn: () => tryApi.getCoins(),
    enabled: isAuthenticated,
  })

  const showBundlesUpsell = coins && coins.totalBalance < 200

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingPage />
  }

  // Authenticated home feed
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Surprise Card */}
        <section className="mb-6">
          <SurpriseCard />
        </section>

        {/* Categories */}
        <section className="mb-6">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Trials Grid */}
        {!isLoading && (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {category === 'all' ? 'Explore Trials Near You' : `${category} Trials`}
              </h2>

              {filteredTrials.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No trials found in this category
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrials.map((trial: any) => (
                    <TrialCard key={trial.id} trial={trial} />
                  ))}
                </div>
              )}
            </section>

            {/* Bundles Upsell (conditional) */}
            {showBundlesUpsell && (
              <section className="mb-8">
                <BundlesUpsell />
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2024 ReZ Try. The smart way to explore your city.</p>
        </div>
      </footer>
    </div>
  )
}
