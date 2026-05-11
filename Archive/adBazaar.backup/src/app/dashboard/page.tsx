'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Wallet,
  BarChart,
  Plus,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Megaphone,
  QrCode,
  Loader2,
} from 'lucide-react'
import { getDashboardStats, getCampaignStats, getRecentActivity, type DashboardStats, type CampaignStats, type ActivityItem } from '@/services/analyticsService'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
  color?: string
  loading?: boolean
}

function StatCard({ title, value, change, icon: Icon, color = '#f59e0b', loading }: StatCardProps) {
  const isPositive = change && change > 0
  return (
    <div
      className="rounded-xl p-6 border border-white/10"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" style={{ color }} /> : <Icon className="w-6 h-6" style={{ color }} />}
        </div>
        {change !== undefined && !loading && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold mb-1">
        {loading ? '—' : value}
      </p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</p>
    </div>
  )
}

interface QuickActionProps {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
  color?: string
}

function QuickAction({ title, description, href, icon: Icon, color = '#f59e0b' }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all group"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div
        className="p-3 rounded-lg transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="font-semibold mb-0.5">{title}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.5)' }} />
    </Link>
  )
}

// Demo data for fallback when API is unavailable
const RECENT_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'scan', message: 'QR code scanned at Phoenix Mall, Bangalore', time: '2 minutes ago', status: 'success' },
  { id: '2', type: 'conversion', message: 'New purchase attributed to Campaign #A1B2', time: '15 minutes ago', status: 'success' },
  { id: '3', type: 'fraud_blocked', message: 'Suspicious scan from VPN location blocked', time: '32 minutes ago', status: 'error' },
  { id: '4', type: 'campaign_paused', message: 'Campaign "Summer Sale 2024" paused', time: '1 hour ago', status: 'warning' },
  { id: '5', type: 'campaign_created', message: 'New campaign "Monsoon Deals" created', time: '2 hours ago', status: 'info' },
]

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: '#22c55e' },
  warning: { icon: PauseCircle, color: '#f59e0b' },
  error: { icon: XCircle, color: '#ef4444' },
  info: { icon: Clock, color: '#3b82f6' },
}

interface CampaignPreview {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  scans: number
  conversions: number
  roi: number
}

const TOP_CAMPAIGNS: CampaignPreview[] = [
  { id: 'A1B2', name: 'Summer Sale 2024', status: 'active', scans: 12450, conversions: 342, roi: 24.5 },
  { id: 'C3D4', name: 'Monsoon Offers', status: 'active', scans: 8932, conversions: 189, roi: 18.2 },
  { id: 'E5F6', name: 'Festival Special', status: 'paused', scans: 5621, conversions: 98, roi: 12.1 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, campaignsData, activityData] = await Promise.all([
          getDashboardStats(),
          getCampaignStats(),
          getRecentActivity(),
        ]);
        setStats(statsData);
        setCampaigns(campaignsData);
        setActivity(activityData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-white/60">Welcome back! Here&apos;s what&apos;s happening with your campaigns.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Active Campaigns"
          value={loading ? 0 : (campaigns.filter(c => c.status === 'active').length || 0)}
          change={stats?.totalCampaigns ? 8 : undefined}
          icon={Megaphone}
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          title="Total Scans"
          value={loading ? '—' : formatNumber(stats?.totalScans || 0)}
          change={stats?.scansToday ? 12 : undefined}
          icon={Eye}
          color="#8b5cf6"
          loading={loading}
        />
        <StatCard
          title="Conversions"
          value={loading ? 0 : (stats?.totalConversions || 0)}
          change={stats?.conversionsToday ? 5 : undefined}
          icon={ShoppingCart}
          color="#22c55e"
          loading={loading}
        />
        <StatCard
          title="Revenue"
          value={loading ? '—' : `₹${formatNumber(stats?.revenue || 0)}`}
          change={stats?.revenue ? 18 : undefined}
          icon={Wallet}
          color="#f59e0b"
          loading={loading}
        />
        <StatCard
          title="Avg ROI"
          value={loading ? '—' : `${(stats?.roi || 0).toFixed(1)}%`}
          change={stats?.roi ? 3 : undefined}
          icon={BarChart}
          color="#ec4899"
          loading={loading}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="Create Campaign"
              description="Start a new advertising campaign"
              href="/dashboard/campaigns/new"
              icon={Plus}
              color="#f59e0b"
            />
            <QuickAction
              title="View Reports"
              description="Access detailed analytics reports"
              href="/dashboard/analytics"
              icon={FileText}
              color="#3b82f6"
            />
            <QuickAction
              title="Generate QR Codes"
              description="Create QR codes for your campaigns"
              href="/dashboard/qr/new"
              icon={QrCode}
              color="#8b5cf6"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="text-sm hover:underline" style={{ color: '#f59e0b' }}>
              View All
            </button>
          </div>
          <div
            className="rounded-xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            {RECENT_ACTIVITY.map((activity, index) => {
              const config = STATUS_CONFIG[activity.status || 'info']
              const StatusIcon = config.icon
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 px-4 py-3"
                  style={{
                    borderBottom: index < RECENT_ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                  }}
                >
                  <StatusIcon className="w-5 h-5 flex-shrink-0" style={{ color: config.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.message}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Campaigns</h2>
          <Link href="/dashboard/campaigns" className="text-sm hover:underline" style={{ color: '#f59e0b' }}>
            View All
          </Link>
        </div>
        <div
          className="rounded-xl border border-white/10 overflow-hidden"
          style={{ backgroundColor: '#1a1a1a' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Campaign</th>
                <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Status</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Scans</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Conversions</th>
                <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>ROI</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
                        <Megaphone className="w-5 h-5" style={{ color: '#f59e0b' }} />
                      </div>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>#{campaign.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          campaign.status === 'active'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : campaign.status === 'paused'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(255, 255, 255, 0.1)',
                        color:
                          campaign.status === 'active'
                            ? '#22c55e'
                            : campaign.status === 'paused'
                            ? '#f59e0b'
                            : 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      {campaign.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-medium">{campaign.scans.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-medium">{campaign.conversions.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium" style={{ color: '#22c55e' }}>+{campaign.roi}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
