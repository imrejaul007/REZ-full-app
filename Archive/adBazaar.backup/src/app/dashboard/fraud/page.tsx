'use client'

import { useState } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  AlertTriangle,
  Eye,
  Smartphone,
  MapPin,
  Clock,
  Filter,
  Download,
  ChevronRight,
  Activity,
  TrendingUp,
  Ban,
  Fingerprint,
  Globe,
} from 'lucide-react'

interface BlockedScan {
  id: string
  timestamp: string
  deviceFingerprint: string
  location: string
  reason: 'vpn_detected' | 'geo_mismatch' | 'rapid_scanning' | 'bot_pattern' | 'duplicate_scan'
  campaign: string
  ipAddress: string
  riskScore: number
}

interface RiskDistribution {
  level: 'low' | 'medium' | 'high' | 'critical'
  count: number
  percentage: number
  color: string
}

const BLOCKED_SCANS: BlockedScan[] = [
  {
    id: 'scan_001',
    timestamp: '2024-08-15 14:32:15',
    deviceFingerprint: 'fp_a7b3c9d2e1f4',
    location: 'Mumbai, India',
    reason: 'vpn_detected',
    campaign: 'Summer Sale 2024',
    ipAddress: '185.220.101.xx',
    riskScore: 92,
  },
  {
    id: 'scan_002',
    timestamp: '2024-08-15 13:45:22',
    deviceFingerprint: 'fp_b8c4d0e3f5a1',
    location: 'New York, USA',
    reason: 'geo_mismatch',
    campaign: 'Monsoon Offers',
    ipAddress: '104.248.xx.xx',
    riskScore: 87,
  },
  {
    id: 'scan_003',
    timestamp: '2024-08-15 12:18:09',
    deviceFingerprint: 'fp_c9d5e1f4a2b6',
    location: 'Delhi, India',
    reason: 'rapid_scanning',
    campaign: 'Festival Special',
    ipAddress: '117.xx.xx.xx',
    riskScore: 78,
  },
  {
    id: 'scan_004',
    timestamp: '2024-08-15 11:55:44',
    deviceFingerprint: 'fp_d0e6f2a5b7c2',
    location: 'Unknown',
    reason: 'bot_pattern',
    campaign: 'Summer Sale 2024',
    ipAddress: '192.168.xx.xx',
    riskScore: 95,
  },
  {
    id: 'scan_005',
    timestamp: '2024-08-15 10:22:33',
    deviceFingerprint: 'fp_e1f7a3b6c3d8',
    location: 'Bangalore, India',
    reason: 'duplicate_scan',
    campaign: 'Monsoon Offers',
    ipAddress: '122.xx.xx.xx',
    riskScore: 65,
  },
]

const REASON_CONFIG = {
  vpn_detected: { label: 'VPN Detected', color: '#ef4444', icon: ShieldAlert },
  geo_mismatch: { label: 'Geo Mismatch', color: '#f59e0b', icon: MapPin },
  rapid_scanning: { label: 'Rapid Scanning', color: '#eab308', icon: Activity },
  bot_pattern: { label: 'Bot Pattern', color: '#dc2626', icon: Smartphone },
  duplicate_scan: { label: 'Duplicate Scan', color: '#8b5cf6', icon: Fingerprint },
}

const RISK_DISTRIBUTION: RiskDistribution[] = [
  { level: 'low', count: 12450, percentage: 78.2, color: '#22c55e' },
  { level: 'medium', count: 2340, percentage: 14.7, color: '#eab308' },
  { level: 'high', count: 890, percentage: 5.6, color: '#f59e0b' },
  { level: 'critical', count: 240, percentage: 1.5, color: '#ef4444' },
]

interface SuspiciousPattern {
  type: 'device_clustering' | 'location_anomaly' | 'time_anomaly' | 'conversion_fraud'
  description: string
  occurrences: number
  lastSeen: string
  severity: 'low' | 'medium' | 'high'
}

const SUSPICIOUS_PATTERNS: SuspiciousPattern[] = [
  {
    type: 'device_clustering',
    description: 'Multiple scans from similar device fingerprints in Mumbai region',
    occurrences: 156,
    lastSeen: '2 hours ago',
    severity: 'high',
  },
  {
    type: 'location_anomaly',
    description: 'Impossible travel detected - scan from Delhi 5 mins after Mumbai',
    occurrences: 23,
    lastSeen: '1 day ago',
    severity: 'high',
  },
  {
    type: 'time_anomaly',
    description: 'Unusual scan patterns between 2-4 AM matching bot activity',
    occurrences: 89,
    lastSeen: '3 days ago',
    severity: 'medium',
  },
  {
    type: 'conversion_fraud',
    description: 'High-value conversions without corresponding scan activity',
    occurrences: 12,
    lastSeen: '5 hours ago',
    severity: 'high',
  },
]

const SEVERITY_CONFIG = {
  low: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  medium: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
}

export default function FraudDashboardPage() {
  const [filterReason, setFilterReason] = useState<string>('all')

  const filteredScans = BLOCKED_SCANS.filter(
    (scan) => filterReason === 'all' || scan.reason === filterReason
  )

  const totalBlocked = BLOCKED_SCANS.length
  const totalChecks = 15920
  const blockedRate = ((totalBlocked / totalChecks) * 100).toFixed(2)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fraud Detection</h1>
          <p className="text-white/60">Monitor and analyze suspicious activity across your campaigns</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
              <ShieldCheck className="w-5 h-5" style={{ color: '#22c55e' }} />
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Checks</span>
          </div>
          <p className="text-3xl font-bold">{totalChecks.toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Last 30 days</p>
        </div>

        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
              <Ban className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Blocked Scans</span>
          </div>
          <p className="text-3xl font-bold">{totalBlocked}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{blockedRate}% block rate</p>
        </div>

        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Suspicious Rate</span>
          </div>
          <p className="text-3xl font-bold">{blockedRate}%</p>
          <p className="text-xs mt-1" style={{ color: '#22c55e' }}>-2.3% from last month</p>
        </div>

        <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
              <Shield className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Fraud Prevented</span>
          </div>
          <p className="text-3xl font-bold">₹4.2L</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Estimated value</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-1">
          <div
            className="rounded-xl border border-white/10 p-5"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <h3 className="font-semibold mb-4">Risk Score Distribution</h3>
            <div className="space-y-4">
              {RISK_DISTRIBUTION.map((risk) => (
                <div key={risk.level}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm capitalize">{risk.level} Risk</span>
                    <span className="text-sm font-medium">{risk.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${risk.percentage}%`, backgroundColor: risk.color }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {risk.percentage}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blocked Scans List */}
        <div className="lg:col-span-2">
          <div
            className="rounded-xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="font-semibold">Blocked Scans</h3>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="px-2 py-1 rounded text-xs border border-white/10 bg-white/5"
              >
                <option value="all">All Reasons</option>
                {Object.entries(REASON_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-white/5">
              {filteredScans.map((scan) => {
                const reasonConfig = REASON_CONFIG[scan.reason]
                const ReasonIcon = reasonConfig.icon
                return (
                  <div key={scan.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${reasonConfig.color}15` }}
                      >
                        <ReasonIcon className="w-4 h-4" style={{ color: reasonConfig.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${reasonConfig.color}15`, color: reasonConfig.color }}
                          >
                            {reasonConfig.label}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {scan.timestamp}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{scan.campaign}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          <span className="flex items-center gap-1">
                            <Fingerprint className="w-3 h-3" />
                            {scan.deviceFingerprint}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {scan.ipAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {scan.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className="text-lg font-bold"
                          style={{ color: scan.riskScore >= 90 ? '#ef4444' : scan.riskScore >= 70 ? '#f59e0b' : '#eab308' }}
                        >
                          {scan.riskScore}
                        </span>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>risk score</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Suspicious Patterns */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Suspicious Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUSPICIOUS_PATTERNS.map((pattern, index) => {
            const severity = SEVERITY_CONFIG[pattern.severity]
            return (
              <div
                key={index}
                className="p-5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" style={{ color: severity.color }} />
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded capitalize"
                      style={{ backgroundColor: severity.bg, color: severity.color }}
                    >
                      {pattern.severity}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {pattern.lastSeen}
                  </span>
                </div>
                <p className="text-sm mb-3">{pattern.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {pattern.occurrences} occurrences
                  </span>
                  <button className="text-xs flex items-center gap-1 hover:underline" style={{ color: '#f59e0b' }}>
                    Investigate <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
