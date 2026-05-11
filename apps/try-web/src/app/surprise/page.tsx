'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { Gift, MapPin, Clock, ChevronLeft } from 'lucide-react'
import { tryApi } from '@/lib/api'

export default function SurprisePage() {
  const [revealed, setRevealed] = useState(false)

  const { data: surprise, isLoading } = useQuery({
    queryKey: ['surprise'],
    queryFn: () => tryApi.getSurpriseTrial(),
  })

  const handleReveal = async () => {
    const result = await tryApi.getSurpriseTrial()
    setRevealed(true)
  }

  const getTimeRemaining = () => {
    if (!surprise?.expiresAt) return ''
    const hours = Math.floor((new Date(surprise.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
    const minutes = Math.floor(((new Date(surprise.expiresAt).getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m left`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </Link>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Weekly Surprise</h1>
          <p className="text-gray-500">Reveal your mystery trial and save big!</p>
        </div>

        {/* Mystery Card (Before Reveal) */}
        {!revealed && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 mb-6">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl w-full h-48 flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-6xl mb-2">❓</p>
                <p className="text-gray-500">Mystery Trial</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">Tap reveal to discover your surprise trial</p>

              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-6">
                <MapPin className="w-4 h-4" />
                <span>{surprise?.distance || 'Nearby'}</span>
                <span className="mx-2">•</span>
                <Clock className="w-4 h-4" />
                <span>{getTimeRemaining()}</span>
              </div>

              <button
                onClick={handleReveal}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-xl"
              >
                Reveal My Surprise 🎁
              </button>
            </div>
          </div>
        )}

        {/* Revealed Card */}
        {revealed && surprise && (
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-purple-100 mb-6">
            <div className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-8xl">{surprise.categoryEmoji || '🎉'}</span>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{surprise.category} Trial</h2>
                <p className="text-gray-500">Your personalized surprise experience</p>
              </div>

              {surprise.trial && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{surprise.trial.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-purple-600">{surprise.trial.coinPrice} 🪙</span>
                    <span className="text-gray-400 line-through">₹{surprise.trial.originalPrice}</span>
                  </div>
                </div>
              )}

              <Link
                href={surprise.trial ? `/trial/${surprise.trial.id}` : '/'}
                className="block w-full bg-purple-600 text-white text-center font-semibold py-4 rounded-xl"
              >
                Book Now →
              </Link>

              <button
                onClick={() => setRevealed(false)}
                className="w-full text-gray-500 text-sm mt-4 hover:text-gray-700"
              >
                Skip this surprise
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-center text-sm text-gray-400">
          One surprise per week. Resets every Sunday.
        </p>
      </main>
    </div>
  )
}
