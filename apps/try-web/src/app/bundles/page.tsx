'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Gift, Check, Sparkles } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

export default function BundlesPage() {
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => tryApi.getBundles(),
  })

  const { data: myBundles = [] } = useQuery({
    queryKey: ['myBundles'],
    queryFn: () => tryApi.getMyBundles(),
  })

  const handleBuy = async (bundleId: string) => {
    alert('In production, this would open Razorpay payment flow')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trial Bundles</h1>
        <p className="text-gray-500 mb-6">Save more with multi-trial passes</p>

        {/* My Bundles */}
        {myBundles.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold text-gray-700 mb-4">Your Active Bundles</h2>
            <div className="space-y-3">
              {myBundles.map((bundle: any) => (
                <div key={bundle.id} className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">{bundle.name}</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{bundle.slotsUsed} / {bundle.slotsTotal} trials used</span>
                    <span>Expires {new Date(bundle.expiresAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(bundle.slotsUsed / bundle.slotsTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Bundles */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-4">Available Bundles</h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bundles available</div>
          ) : (
            <div className="space-y-4">
              {bundles.map((bundle: any) => {
                const savings = Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100)
                const isFeatured = bundle.isFeatured

                return (
                  <div
                    key={bundle.id}
                    className={`rounded-2xl overflow-hidden ${isFeatured ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white' : 'bg-white border border-gray-200'}`}
                  >
                    {isFeatured && (
                      <div className="bg-white/20 px-4 py-1 text-xs font-semibold">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        FEATURED
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className={`font-bold text-lg ${isFeatured ? 'text-white' : 'text-gray-900'}`}>
                            {bundle.name}
                          </h3>
                          <p className={`text-sm ${isFeatured ? 'text-purple-200' : 'text-gray-500'}`}>
                            {bundle.description}
                          </p>
                        </div>
                        {savings > 0 && (
                          <div className={`${isFeatured ? 'bg-white/20' : 'bg-green-100'} px-2 py-1 rounded-lg`}>
                            <span className={`font-bold text-sm ${isFeatured ? 'text-white' : 'text-green-700'}`}>
                              Save {savings}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`${isFeatured ? 'text-white' : 'text-gray-900'} text-3xl font-bold mb-4`}>
                        ₹{bundle.price}
                        <span className={`text-lg font-normal ${isFeatured ? 'text-purple-200' : 'text-gray-400'} line-through ml-2`}>
                          ₹{bundle.originalPrice}
                        </span>
                      </div>

                      <div className={`${isFeatured ? 'text-purple-100' : 'text-gray-600'} text-sm mb-4`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4" />
                          <span>{bundle.trialCount} trials included</span>
                        </div>
                        {bundle.trialCoinsIncluded > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4" />
                            <span>+{bundle.trialCoinsIncluded} bonus coins</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span>Valid for {bundle.validDays} days</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuy(bundle.id)}
                        className={`w-full py-3 rounded-xl font-semibold transition ${
                          isFeatured
                            ? 'bg-white text-purple-700 hover:bg-purple-50'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        Buy Bundle
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
