'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => tryApi.getLeaderboard('Mumbai', period),
  })

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
    return <span className="w-6 text-center font-bold text-gray-500">{rank}</span>
  }

  const getRankChange = () => {
    const changes = ['up', 'up', 'down', 'same', 'up', 'same']
    return changes[Math.floor(Math.random() * changes.length)]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Leaderboard</h1>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6">
          {(['weekly', 'monthly', 'alltime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {p === 'weekly' ? 'This Week' : p === 'monthly' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Your Rank */}
        {data?.userRank && (
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-purple-600 font-medium mb-1">Your Rank</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-purple-700">#{data.userRank}</span>
                <span className="text-gray-600">{data.userScore} points</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm font-medium">+3</span>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-2">
            {data?.entries?.map((entry: any, index: number) => {
              const isCurrentUser = entry.isCurrentUser
              const rankChange = getRankChange()

              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 p-4 rounded-xl transition ${
                    isCurrentUser
                      ? 'bg-purple-50 border-2 border-purple-300'
                      : 'bg-white border border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className={`font-semibold ${isCurrentUser ? 'text-purple-700' : 'text-gray-900'}`}>
                      {entry.name}
                      {isCurrentUser && <span className="text-xs text-purple-500 ml-2">(You)</span>}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{entry.trialCount} trials</p>
                  </div>

                  {/* Change Indicator */}
                  <div className="w-8 flex justify-center">
                    {rankChange === 'up' && <ChevronUp className="w-4 h-4 text-green-500" />}
                    {rankChange === 'down' && <ChevronDown className="w-4 h-4 text-red-500" />}
                    {rankChange === 'same' && <Minus className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
