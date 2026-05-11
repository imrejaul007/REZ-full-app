'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Star, Flame, Trophy, MapPin } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function ProfilePage() {
  const { data: score } = useQuery({
    queryKey: ['score'],
    queryFn: () => tryApi.getScore(),
  })

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => tryApi.getBadges(),
  })

  const tierColors = {
    curious: 'from-blue-500 to-blue-600',
    explorer: 'from-nileBlue to-blue-700',
    adventurer: 'from-amber-500 to-orange-500',
    pioneer: 'from-yellow-400 to-amber-500',
  }

  const tierIcons = {
    curious: '👁️',
    explorer: '🧭',
    adventurer: '🚀',
    pioneer: '⭐',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Score Card */}
        <div className={`bg-gradient-to-r ${tierColors[score?.tier || 'curious']} rounded-2xl p-6 text-white mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">Your Score</p>
              <p className="text-4xl font-bold">{score?.score || 0}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
              {tierIcons[score?.tier || 'curious']}
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-center">
            <p className="font-semibold capitalize">{score?.tier} Explorer</p>
            <p className="text-sm text-white/70">
              {score?.nextTierPoints ? `${score.nextTierPoints - score.score} points to next tier` : 'Max tier reached'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <Star className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">{score?.stats?.categoriesTried || 0}</p>
            <p className="text-sm text-gray-500">Categories</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold text-gray-900">{score?.stats?.merchantsDiscovered || 0}</p>
            <p className="text-sm text-gray-500">Merchants</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <Flame className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-gray-900">{score?.stats?.currentStreak || 0}</p>
            <p className="text-sm text-gray-500">Day Streak</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-gray-900">{score?.stats?.reviewsGiven || 0}</p>
            <p className="text-sm text-gray-500">Reviews</p>
          </div>
        </div>

        {/* Leaderboard */}
        {score?.leaderboardPercentile && (
          <Link href="/leaderboard" className="block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Leaderboard Rank</p>
                <p className="font-semibold text-gray-900">
                  Top {score.leaderboardPercentile}% in {score.leaderboardCity || 'your city'}
                </p>
              </div>
              <span className="text-purple-600 font-medium">View →</span>
            </div>
          </Link>
        )}

        {/* Badges */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Badges</h2>
            <Link href="/badges" className="text-purple-600 text-sm font-medium">View All →</Link>
          </div>

          {badges?.earned?.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.earned.slice(0, 6).map((badge: any) => (
                <div key={badge.category} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-xl mb-1">
                    {badge.categoryEmoji || '🏅'}
                  </div>
                  <p className="text-xs font-medium text-gray-700 capitalize">{badge.category}</p>
                  <p className="text-xs text-gray-400">{badge.level}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No badges yet. Complete trials to earn badges!</p>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 space-y-3">
          <Link href="/history" className="block bg-white rounded-xl p-4 border border-gray-100">
            <span className="font-medium text-gray-900">My Bookings →</span>
          </Link>
          <Link href="/coins" className="block bg-white rounded-xl p-4 border border-gray-100">
            <span className="font-medium text-gray-900">My Coins →</span>
          </Link>
          <Link href="/missions" className="block bg-white rounded-xl p-4 border border-gray-100">
            <span className="font-medium text-gray-900">Weekly Missions →</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
