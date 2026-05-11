'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Pause,
  Play,
  Copy,
  Trash2,
  Megaphone,
  Eye,
  ShoppingCart,
  TrendingUp,
  Calendar,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: 'billboard' | 'retail' | 'influencer' | 'digital'
  status: 'active' | 'paused' | 'completed' | 'draft'
  startDate: string
  endDate: string
  budget: number
  spent: number
  scans: number
  conversions: number
  roi: number
  locations: string[]
}

type SortKey = 'scans' | 'conversions' | 'roi' | 'budget'
type FilterStatus = 'all' | 'active' | 'paused' | 'completed' | 'draft'
type FilterType = 'all' | 'billboard' | 'retail' | 'influencer' | 'digital'

const CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_001',
    name: 'Summer Sale 2024',
    type: 'billboard',
    status: 'active',
    startDate: '2024-05-01',
    endDate: '2024-08-31',
    budget: 150000,
    spent: 67500,
    scans: 12450,
    conversions: 342,
    roi: 2.4,
    locations: ['Mumbai', 'Delhi'],
  },
  {
    id: 'camp_002',
    name: 'Restaurant Week Promo',
    type: 'retail',
    status: 'active',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    budget: 75000,
    spent: 42000,
    scans: 8920,
    conversions: 156,
    roi: 1.8,
    locations: ['Bangalore'],
  },
  {
    id: 'camp_003',
    name: 'Influencer Collab - Fitness',
    type: 'influencer',
    status: 'paused',
    startDate: '2024-04-15',
    endDate: '2024-07-15',
    budget: 200000,
    spent: 85000,
    scans: 15600,
    conversions: 89,
    roi: 0.9,
    locations: ['Pan India'],
  },
]

function SortHeader({ label, sortKeyName, sortKey, sortDesc, onSort }: {
  label: string
  sortKeyName: SortKey
  sortKey: SortKey | null
  sortDesc: boolean
  onSort: (key: SortKey) => void
}) {
  return (
    <button
      className="flex items-center gap-1 text-xs font-medium hover:underline"
      style={{ color: sortKey === sortKeyName ? '#f59e0b' : 'rgba(255,255,255,0.5)' }}
      onClick={() => onSort(sortKeyName)}
    >
      {label}
      {sortKey === sortKeyName && (
        <ChevronDown className={`w-3 h-3 transition-transform ${sortDesc ? '' : 'rotate-180'}`} />
      )}
    </button>
  )
}

export default function CampaignsPage() {
  const [campaigns] = useState<Campaign[]>(CAMPAIGNS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDesc, setSortDesc] = useState(true)
  const [visibleMenu, setVisibleMenu] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  const filtered = campaigns
    .filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (filterType !== 'all' && c.type !== filterType) return false
      return true
    })
    .sort((a, b) => {
      if (!sortKey) return 0
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDesc ? bVal - aVal : aVal - bVal
      }
      return 0
    })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-white/60">Manage and monitor your advertising campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#f59e0b', color: '#000' }}
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-xs text-white/50 mb-1">Total Campaigns</p>
          <p className="text-2xl font-bold">{campaigns.length}</p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-xs text-white/50 mb-1">Active</p>
          <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
            {campaigns.filter((c) => c.status === 'active').length}
          </p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-xs text-white/50 mb-1">Total Scans</p>
          <p className="text-2xl font-bold">
            {campaigns.reduce((s, c) => s + c.scans, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#1a1a1a' }}>
          <p className="text-xs text-white/50 mb-1">Avg ROI</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
            {(campaigns.reduce((s, c) => s + c.roi, 0) / campaigns.length).toFixed(1)}x
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none text-sm"
            style={{ backgroundColor: '#1a1a1a' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none text-sm"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="px-3 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-amber-500 focus:outline-none text-sm"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <option value="all">All Types</option>
          <option value="billboard">Billboard</option>
          <option value="retail">Retail</option>
          <option value="influencer">Influencer</option>
          <option value="digital">Digital</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Campaign
                </th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Status
                </th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Type
                </th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <SortHeader label="Scans" sortKeyName="scans" sortKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
                </th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <SortHeader label="Conversions" sortKeyName="conversions" sortKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
                </th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <SortHeader label="ROI" sortKeyName="roi" sortKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
                </th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Budget
                </th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((campaign) => (
                <tr key={campaign.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-white/40">
                        {campaign.locations.join(', ')}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          campaign.status === 'active'
                            ? 'rgba(34,197,94,0.15)'
                            : campaign.status === 'paused'
                              ? 'rgba(234,179,8,0.15)'
                              : 'rgba(255,255,255,0.1)',
                        color:
                          campaign.status === 'active'
                            ? '#22c55e'
                            : campaign.status === 'paused'
                              ? '#eab308'
                              : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            campaign.status === 'active'
                              ? '#22c55e'
                              : campaign.status === 'paused'
                                ? '#eab308'
                                : 'rgba(255,255,255,0.5)',
                        }}
                      />
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-white/70 capitalize">
                    {campaign.type}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    {campaign.scans.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    {campaign.conversions.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className="font-mono font-medium"
                      style={{ color: campaign.roi >= 1 ? '#22c55e' : '#ef4444' }}
                    >
                      {campaign.roi.toFixed(1)}x
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    ₹{(campaign.budget / 1000).toFixed(0)}K
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}/edit`}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </Link>
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </Link>
                      <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-white/50">No campaigns found</p>
          </div>
        )}
      </div>
    </div>
  )
}
