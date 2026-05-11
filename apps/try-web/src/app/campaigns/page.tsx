'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Trophy, Target, Zap, TrendingUp, ChevronRight } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function CampaignsPage() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => tryApi.getCampaigns('Mumbai'),
  })

  const typeConfig = {
    MISSION_SPRINT: { icon: Target, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Mission Sprint' },
    FESTIVAL: { icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Festival' },
    CATEGORY_PUSH: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', label: 'Category Push' },
  }

  const getTimeRemaining = (endAt: string) => {
    const days = Math.floor((new Date(endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Ended'
    if (days === 0) return 'Ending today'
    if (days === 1) return '1 day left'
    return `${days} days left`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaigns</h1>
        <p className="text-gray-500 mb-6">Special events and time-limited challenges</p>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No active campaigns</p>
            <p className="text-sm text-gray-400">Check back soon for new events!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign: any) => {
              const config = typeConfig[campaign.type] || typeConfig.FESTIVAL
              const Icon = config.icon
              const progress = campaign.progress ? (campaign.progress.completed / campaign.progress.target) * 100 : 0

              return (
                <div
                  key={campaign.id}
                  className={`rounded-xl overflow-hidden border ${campaign.isCompleted ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}
                >
                  <div className={`${config.bg} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                          {campaign.isCompleted && (
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{config.label}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {getTimeRemaining(campaign.endsAt)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4">
                    {campaign.description && (
                      <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{campaign.goal}</span>
                        <span className="text-purple-600 font-semibold">{campaign.reward}</span>
                      </div>

                      {campaign.progress && (
                        <>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${campaign.isCompleted ? 'bg-green-500' : 'bg-purple-500'} rounded-full transition-all`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {campaign.progress.completed} / {campaign.progress.target} completed
                          </p>
                        </>
                      )}
                    </div>

                    {!campaign.isJoined && !campaign.isCompleted && (
                      <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
                        Join Campaign
                      </button>
                    )}

                    {campaign.isJoined && !campaign.isCompleted && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>You're participating</span>
                        <Link href="/" className="text-purple-600 font-medium ml-auto flex items-center">
                          Explore trials <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
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
