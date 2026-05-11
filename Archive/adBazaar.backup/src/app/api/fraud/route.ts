import { NextRequest, NextResponse } from 'next/server'

// Types
interface FraudStats {
  totalChecks: number
  blockedScans: number
  suspiciousRate: number
  fraudPrevented: number
  lastUpdated: string
}

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

interface SuspiciousPattern {
  id: string
  type: 'device_clustering' | 'location_anomaly' | 'time_anomaly' | 'conversion_fraud'
  description: string
  occurrences: number
  lastSeen: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface RiskDistribution {
  level: string
  count: number
  percentage: number
}

// Mock data
const fraudStats: FraudStats = {
  totalChecks: 15920,
  blockedScans: 156,
  suspiciousRate: 0.98,
  fraudPrevented: 42000,
  lastUpdated: new Date().toISOString(),
}

const blockedScans: BlockedScan[] = [
  {
    id: 'scan_001',
    timestamp: '2024-08-15T14:32:15Z',
    deviceFingerprint: 'fp_a7b3c9d2e1f4',
    location: 'Mumbai, India',
    reason: 'vpn_detected',
    campaign: 'Summer Sale 2024',
    ipAddress: '185.220.101.xx',
    riskScore: 92,
  },
  {
    id: 'scan_002',
    timestamp: '2024-08-15T13:45:22Z',
    deviceFingerprint: 'fp_b8c4d0e3f5a1',
    location: 'New York, USA',
    reason: 'geo_mismatch',
    campaign: 'Monsoon Offers',
    ipAddress: '104.248.xx.xx',
    riskScore: 87,
  },
  {
    id: 'scan_003',
    timestamp: '2024-08-15T12:18:09Z',
    deviceFingerprint: 'fp_c9d5e1f4a2b6',
    location: 'Delhi, India',
    reason: 'rapid_scanning',
    campaign: 'Festival Special',
    ipAddress: '117.xx.xx.xx',
    riskScore: 78,
  },
  {
    id: 'scan_004',
    timestamp: '2024-08-15T11:55:44Z',
    deviceFingerprint: 'fp_d0e6f2a5b7c2',
    location: 'Unknown',
    reason: 'bot_pattern',
    campaign: 'Summer Sale 2024',
    ipAddress: '192.168.xx.xx',
    riskScore: 95,
  },
  {
    id: 'scan_005',
    timestamp: '2024-08-15T10:22:33Z',
    deviceFingerprint: 'fp_e1f7a3b6c3d8',
    location: 'Bangalore, India',
    reason: 'duplicate_scan',
    campaign: 'Monsoon Offers',
    ipAddress: '122.xx.xx.xx',
    riskScore: 65,
  },
]

const suspiciousPatterns: SuspiciousPattern[] = [
  {
    id: 'pattern_001',
    type: 'device_clustering',
    description: 'Multiple scans from similar device fingerprints in Mumbai region',
    occurrences: 156,
    lastSeen: '2024-08-15T12:00:00Z',
    severity: 'high',
  },
  {
    id: 'pattern_002',
    type: 'location_anomaly',
    description: 'Impossible travel detected - scan from Delhi 5 mins after Mumbai',
    occurrences: 23,
    lastSeen: '2024-08-14T18:00:00Z',
    severity: 'critical',
  },
  {
    id: 'pattern_003',
    type: 'time_anomaly',
    description: 'Unusual scan patterns between 2-4 AM matching bot activity',
    occurrences: 89,
    lastSeen: '2024-08-12T03:00:00Z',
    severity: 'medium',
  },
  {
    id: 'pattern_004',
    type: 'conversion_fraud',
    description: 'High-value conversions without corresponding scan activity',
    occurrences: 12,
    lastSeen: '2024-08-15T10:00:00Z',
    severity: 'high',
  },
]

const riskDistribution: RiskDistribution[] = [
  { level: 'low', count: 12450, percentage: 78.2 },
  { level: 'medium', count: 2340, percentage: 14.7 },
  { level: 'high', count: 890, percentage: 5.6 },
  { level: 'critical', count: 240, percentage: 1.5 },
]

// GET /api/fraud/stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')

  try {
    switch (endpoint) {
      case 'stats':
        return NextResponse.json({
          success: true,
          data: fraudStats,
        })

      case 'blocked':
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const reason = searchParams.get('reason')

        let filtered = blockedScans
        if (reason) {
          filtered = blockedScans.filter((scan) => scan.reason === reason)
        }

        const start = (page - 1) * limit
        const end = start + limit
        const paginated = filtered.slice(start, end)

        return NextResponse.json({
          success: true,
          data: {
            items: paginated,
            total: filtered.length,
            page,
            limit,
            totalPages: Math.ceil(filtered.length / limit),
          },
        })

      case 'suspicious':
        return NextResponse.json({
          success: true,
          data: {
            patterns: suspiciousPatterns,
            distribution: riskDistribution,
          },
        })

      case 'risk':
        return NextResponse.json({
          success: true,
          data: riskDistribution,
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            stats: fraudStats,
            recentBlocked: blockedScans.slice(0, 10),
            suspiciousPatterns: suspiciousPatterns.slice(0, 5),
            riskDistribution,
          },
        })
    }
  } catch (error) {
    console.error('Fraud API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
