'use client'

import { useState } from 'react'
import {
  Coins,
  Plus,
  Wallet,
  Gift,
  ArrowUpRight,
  ArrowDownRight,
  History,
  TrendingUp,
  Users,
  Calendar,
  Copy,
  Check,
  X,
  Edit,
  MoreHorizontal,
} from 'lucide-react'

interface BrandCoin {
  id: string
  name: string
  symbol: string
  value: number
  totalSupply: number
  distributed: number
  redeemed: number
  createdAt: string
  expiresAt: string
  logo: string
  status: 'active' | 'paused' | 'expired'
}

interface Distribution {
  id: string
  coinId: string
  coinSymbol: string
  amount: number
  recipient: string
  recipientEmail: string
  timestamp: string
  campaign: string
}

interface Redemption {
  id: string
  coinSymbol: string
  amount: number
  user: string
  reward: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
}

const BRAND_COINS: BrandCoin[] = [
  {
    id: 'coin_001',
    name: 'Flipkart SuperCoin',
    symbol: 'FKTS',
    value: 1,
    totalSupply: 1000000,
    distributed: 450000,
    redeemed: 320000,
    createdAt: '2024-01-15',
    expiresAt: '2025-01-15',
    logo: '🛒',
    status: 'active',
  },
  {
    id: 'coin_002',
    name: 'Swiggy Coin',
    symbol: 'SWIG',
    value: 0.5,
    totalSupply: 500000,
    distributed: 280000,
    redeemed: 195000,
    createdAt: '2024-03-01',
    expiresAt: '2024-12-31',
    logo: '🍔',
    status: 'active',
  },
  {
    id: 'coin_003',
    name: 'Myntra StyleCoin',
    symbol: 'MYTR',
    value: 2,
    totalSupply: 250000,
    distributed: 180000,
    redeemed: 180000,
    createdAt: '2023-06-01',
    expiresAt: '2024-06-01',
    logo: '👗',
    status: 'expired',
  },
]

const DISTRIBUTIONS: Distribution[] = [
  { id: 'd1', coinId: 'coin_001', coinSymbol: 'FKTS', amount: 100, recipient: 'Rahul Sharma', recipientEmail: 'rahul@example.com', timestamp: '2024-08-15 14:32', campaign: 'Summer Sale' },
  { id: 'd2', coinId: 'coin_001', coinSymbol: 'FKTS', amount: 250, recipient: 'Priya Patel', recipientEmail: 'priya@example.com', timestamp: '2024-08-15 13:15', campaign: 'Flash Sale' },
  { id: 'd3', coinId: 'coin_002', coinSymbol: 'SWIG', amount: 50, recipient: 'Amit Kumar', recipientEmail: 'amit@example.com', timestamp: '2024-08-15 11:45', campaign: 'Food Festival' },
  { id: 'd4', coinId: 'coin_002', coinSymbol: 'SWIG', amount: 100, recipient: 'Sneha Reddy', recipientEmail: 'sneha@example.com', timestamp: '2024-08-15 10:20', campaign: 'Weekend Deals' },
]

const REDEMPTIONS: Redemption[] = [
  { id: 'r1', coinSymbol: 'FKTS', amount: 500, user: 'Rahul S.', reward: '₹500 Off Coupon', timestamp: '2024-08-15 16:00', status: 'completed' },
  { id: 'r2', coinSymbol: 'FKTS', amount: 200, user: 'Priya P.', reward: 'Free Delivery', timestamp: '2024-08-15 15:30', status: 'completed' },
  { id: 'r3', coinSymbol: 'SWIG', amount: 150, user: 'Amit K.', reward: '₹75 Off', timestamp: '2024-08-15 14:00', status: 'pending' },
]

const STATUS_CONFIG = {
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  paused: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  expired: { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255, 255, 255, 0.1)' },
}

const TAB_LIST = [
  { id: 'overview', label: 'Overview', icon: Coins },
  { id: 'create', label: 'Create Coin', icon: Plus },
  { id: 'distributions', label: 'Distributions', icon: ArrowUpRight },
  { id: 'redemptions', label: 'Redemptions', icon: Gift },
]

export default function BrandCoinsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newCoin, setNewCoin] = useState({
    name: '',
    symbol: '',
    value: '',
    totalSupply: '',
    expiration: '',
  })

  const totalCreated = BRAND_COINS.reduce((sum, c) => sum + c.totalSupply, 0)
  const totalDistributed = BRAND_COINS.reduce((sum, c) => sum + c.distributed, 0)
  const totalRedeemed = BRAND_COINS.reduce((sum, c) => sum + c.redeemed, 0)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateCoin = () => {
    console.log('Creating coin:', newCoin)
    setShowCreateModal(false)
    setNewCoin({ name: '', symbol: '', value: '', totalSupply: '', expiration: '' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Brand Coins</h1>
          <p className="text-white/60">Manage loyalty coins for your campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#f59e0b', color: '#000' }}
        >
          <Plus className="w-4 h-4" />
          Create Coin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-6" style={{ backgroundColor: '#1a1a1a' }}>
        {TAB_LIST.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive ? '' : 'hover:bg-white/5'
              }`}
              style={isActive ? { backgroundColor: '#f59e0b', color: '#000' } : { color: 'rgba(255,255,255,0.6)' }}
            >
              <span className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                  <Coins className="w-5 h-5" style={{ color: '#f59e0b' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Created</span>
              </div>
              <p className="text-3xl font-bold">{totalCreated.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{BRAND_COINS.length} coin types</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                  <ArrowUpRight className="w-5 h-5" style={{ color: '#3b82f6' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Distributed</span>
              </div>
              <p className="text-3xl font-bold">{totalDistributed.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{((totalDistributed / totalCreated) * 100).toFixed(1)}% of total</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                  <Gift className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Redeemed</span>
              </div>
              <p className="text-3xl font-bold">{totalRedeemed.toLocaleString()}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{((totalRedeemed / totalDistributed) * 100).toFixed(1)}% of distributed</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <Users className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Active Users</span>
              </div>
              <p className="text-3xl font-bold">12,450</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>+234 this week</p>
            </div>
          </div>

          {/* Coins List */}
          <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="font-semibold">Your Brand Coins</h3>
            </div>
            <div className="divide-y divide-white/5">
              {BRAND_COINS.map((coin) => (
                <div key={coin.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: '#f59e0b20' }}
                    >
                      {coin.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{coin.name}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: STATUS_CONFIG[coin.status].bg, color: STATUS_CONFIG[coin.status].color }}
                        >
                          {coin.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <span className="flex items-center gap-1">
                          <Copy
                            className="w-3 h-3 cursor-pointer hover:text-white"
                            onClick={(e) => { e.stopPropagation(); handleCopy(coin.symbol, coin.id) }}
                          />
                          {copiedId === coin.id ? <Check className="w-3 h-3 text-green-400" /> : coin.symbol}
                        </span>
                        <span>₹{coin.value} per coin</span>
                        <span>Exp: {coin.expiresAt}</span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{coin.totalSupply.toLocaleString()}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Supply</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{coin.distributed.toLocaleString()}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Distributed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-400">{coin.redeemed.toLocaleString()}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Redeemed</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/10">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Mobile stats */}
                  <div className="flex md:hidden gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Supply: </span>
                      <span className="font-medium">{coin.totalSupply.toLocaleString()}</span>
                    </div>
                    <div className="text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Distributed: </span>
                      <span className="font-medium">{coin.distributed.toLocaleString()}</span>
                    </div>
                    <div className="text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Redeemed: </span>
                      <span className="font-medium text-green-400">{coin.redeemed.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Coin Tab */}
      {activeTab === 'create' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border border-white/10 p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <h3 className="text-lg font-semibold mb-6">Create New Brand Coin</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Coin Name</label>
                <input
                  type="text"
                  placeholder="e.g., Flipkart SuperCoin"
                  value={newCoin.name}
                  onChange={(e) => setNewCoin({ ...newCoin, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g., FKTS"
                    value={newCoin.symbol}
                    onChange={(e) => setNewCoin({ ...newCoin, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Value (₹ per coin)</label>
                  <input
                    type="number"
                    placeholder="e.g., 1"
                    value={newCoin.value}
                    onChange={(e) => setNewCoin({ ...newCoin, value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Supply</label>
                  <input
                    type="number"
                    placeholder="e.g., 100000"
                    value={newCoin.totalSupply}
                    onChange={(e) => setNewCoin({ ...newCoin, totalSupply: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expiration Date</label>
                  <input
                    type="date"
                    value={newCoin.expiration}
                    onChange={(e) => setNewCoin({ ...newCoin, expiration: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleCreateCoin}
                  className="flex-1 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#f59e0b', color: '#000' }}
                >
                  Create Coin
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distributions Tab */}
      {activeTab === 'distributions' && (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-semibold">Recent Distributions</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Recipient</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Coin</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Amount</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Campaign</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {DISTRIBUTIONS.map((dist) => (
                <tr key={dist.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{dist.recipient}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{dist.recipientEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm" style={{ color: '#f59e0b' }}>{dist.coinSymbol}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">+{dist.amount}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{dist.campaign}</td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{dist.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Redemptions Tab */}
      {activeTab === 'redemptions' && (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="font-semibold">Redemption History</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>User</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Coin</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Amount</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Reward</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {REDEMPTIONS.map((red) => (
                <tr key={red.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="px-4 py-3 font-medium">{red.user}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm" style={{ color: '#f59e0b' }}>{red.coinSymbol}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-400">-{red.amount}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{red.reward}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: red.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : red.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: red.status === 'completed' ? '#22c55e' : red.status === 'pending' ? '#f59e0b' : '#ef4444',
                      }}
                    >
                      {red.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{red.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateModal(false)} />
          <div
            className="relative w-full max-w-md rounded-xl border border-white/10 p-6"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <button
              className="absolute top-4 right-4 p-1 rounded hover:bg-white/10"
              onClick={() => setShowCreateModal(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-6">Create New Brand Coin</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Coin Name</label>
                <input
                  type="text"
                  placeholder="e.g., Flipkart SuperCoin"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g., FKTS"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Value (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g., 1"
                    className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Supply</label>
                <input
                  type="number"
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expiration Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateCoin}
                  className="flex-1 py-2.5 rounded-lg font-semibold"
                  style={{ backgroundColor: '#f59e0b', color: '#000' }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 rounded-lg font-medium border border-white/10 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
