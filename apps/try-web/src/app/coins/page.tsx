'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Gift, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react'
import { tryApi } from '@/lib/api'
import { Header } from '@/components/Header'

const COIN_PACKS = [
  { index: 0, price: 49, coins: 60, label: '₹49', savings: 0 },
  { index: 1, price: 99, coins: 140, label: '₹99', savings: 10 },
  { index: 2, price: 199, coins: 320, label: '₹199', savings: 20 },
  { index: 3, price: 399, coins: 700, label: '₹399', savings: 30 },
]

export default function CoinsPage() {
  const [selectedPack, setSelectedPack] = useState<number | null>(null)

  const { data: coins, isLoading } = useQuery({
    queryKey: ['coins'],
    queryFn: () => tryApi.getCoins(),
  })

  const handleBuy = async (pack: typeof COIN_PACKS[0]) => {
    // In production, this would create a Razorpay order
    alert(`In production, this would open Razorpay for ₹${pack.price}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-nileBlue to-purple-700 rounded-2xl p-6 text-white mb-6">
          <p className="text-white/70 text-sm">Your Balance</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-bold">{coins?.totalBalance || 0}</span>
            <span className="text-2xl">🪙</span>
          </div>
          <p className="text-white/70 text-sm mt-1">Trial Coins</p>
        </div>

        {/* Expiry Buckets */}
        {coins?.buckets && coins.buckets.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Your Coin Buckets</h2>
            <div className="space-y-3">
              {coins.buckets.map((bucket: any, i: number) => {
                const daysLeft = Math.ceil((new Date(bucket.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const isExpiring = daysLeft < 7

                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isExpiring ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-gray-900">{bucket.amount} 🪙</p>
                      <p className="text-xs text-gray-500">{bucket.source === 'pack' ? 'Purchased' : 'Earned'}</p>
                    </div>
                    <div className="text-right">
                      {isExpiring ? (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{daysLeft} days left</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Expires {new Date(bucket.expiresAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Buy Coins */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Buy More Coins</h2>
          <div className="grid grid-cols-2 gap-3">
            {COIN_PACKS.map((pack) => (
              <button
                key={pack.index}
                onClick={() => handleBuy(pack)}
                className={`relative p-4 rounded-xl border-2 text-left transition ${
                  selectedPack === pack.index ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pack.savings > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Save {pack.savings}%
                  </div>
                )}
                <p className="text-lg font-bold text-gray-900">₹{pack.price}</p>
                <p className="text-2xl font-bold text-purple-600">{pack.coins} 🪙</p>
                <p className="text-xs text-gray-500">₹{(pack.price / pack.coins).toFixed(2)}/coin</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        {coins?.recentTransactions && coins.recentTransactions.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Recent Transactions</h2>
            <div className="space-y-3">
              {coins.recentTransactions.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-green-100' : tx.type === 'spend' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {tx.type === 'earn' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className={`w-5 h-5 ${tx.type === 'spend' ? 'text-red-600' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                  </div>
                  <p className={`font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
