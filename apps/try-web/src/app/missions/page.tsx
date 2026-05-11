'use client'

import { useQuery } from '@tanstack/react-query'
import { Target, Clock } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function MissionsPage() {
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => tryApi.getMissions(),
  })

  const getTimeRemaining = (endAt: string) => {
    const days = Math.floor((new Date(endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const hours = Math.floor(((new Date(endAt).getTime() - Date.now()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h left`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Weekly Missions</h1>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Clock className="w-4 h-4" />
            <span>Resets Sunday</span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : missions.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No missions this week</p>
            <p className="text-sm text-gray-400">Check back Monday for fresh missions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission: any) => {
              const progress = (mission.completed / mission.target) * 100
              const isComplete = mission.isCompleted
              const isExpired = mission.isExpired

              return (
                <div
                  key={mission.id}
                  className={`bg-white rounded-xl p-5 border border-gray-100 ${isComplete ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{mission.categoryEmoji}</span>
                        <h3 className="font-semibold text-gray-900">{mission.title}</h3>
                      </div>
                      {mission.description && (
                        <p className="text-sm text-gray-500">{mission.description}</p>
                      )}
                    </div>

                    {isComplete && (
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                        COMPLETED
                      </span>
                    )}
                    {isExpired && (
                      <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">
                        EXPIRED
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {mission.completed} / {mission.target} completed
                    </p>
                  </div>

                  {/* Reward */}
                  <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                    <p className="text-sm text-purple-700">
                      🪙 {mission.reward.rezCoins} ReZ Coins + {mission.reward.trialCoins} Trial Coins on completion
                    </p>
                  </div>

                  {/* Time */}
                  {!isComplete && !isExpired && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeRemaining(mission.endsAt)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
