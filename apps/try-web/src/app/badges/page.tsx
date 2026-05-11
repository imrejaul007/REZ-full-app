'use client'

import { useQuery } from '@tanstack/react-query'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function BadgesPage() {
  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => tryApi.getBadges(),
  })

  const levelColors = {
    Newcomer: 'border-gray-300 bg-gray-50',
    Regular: 'border-amber-600 bg-amber-50',
    Expert: 'border-gray-400 bg-gray-100',
    Master: 'border-yellow-400 bg-yellow-50',
  }

  const levelEmoji = {
    Newcomer: '🌱',
    Regular: '⭐',
    Expert: '🏅',
    Master: '👑',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Badges</h1>

        {/* Earned Badges */}
        {badges?.earned && badges.earned.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-700 mb-4">Earned Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {badges.earned.map((badge: any) => (
                <div
                  key={badge.category}
                  className={`rounded-xl p-4 border-2 ${levelColors[badge.level] || levelColors.Newcomer}`}
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white flex items-center justify-center text-2xl border-2 border-current">
                    {badge.categoryEmoji || '🏅'}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center capitalize mb-1">
                    {badge.category}
                  </h3>
                  <p className="text-sm text-gray-500 text-center mb-2">
                    {badge.level}
                  </p>
                  <div className="text-xs text-gray-400 text-center">
                    {badge.trialCount} trials
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min((badge.trialCount / badge.nextLevelThreshold) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    {badge.nextLevelThreshold - badge.trialCount} more for next level
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Undiscovered */}
        {badges?.undiscovered && badges.undiscovered.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">Discover More</h2>
            <div className="grid grid-cols-2 gap-4">
              {badges.undiscovered.map((badge: any) => (
                <div
                  key={badge.category}
                  className="rounded-xl p-4 border border-gray-200 bg-white opacity-60"
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-2xl grayscale">
                    {badge.categoryEmoji || '❓'}
                  </div>
                  <h3 className="font-semibold text-gray-500 text-center capitalize mb-2">
                    {badge.category}
                  </h3>
                  <p className="text-xs text-gray-400 text-center">
                    Try your first {badge.category} trial
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!badges?.earned || badges.earned.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No badges yet</p>
            <p className="text-sm text-gray-400">
              Complete trials to earn badges in different categories!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
