import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import logger from '@/lib/logger'

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!accessToken) return null
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return error || !user ? null : user
}

// GET /api/adbazaar/activity/recent — get recent activity feed
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req)

    // Demo data for development or when not authenticated
    const demoActivity = [
      {
        id: '1',
        type: 'scan',
        message: 'QR code scanned at Phoenix Mall, Bangalore',
        time: '2 minutes ago',
        status: 'success',
      },
      {
        id: '2',
        type: 'conversion',
        message: 'New purchase attributed to Campaign #A1B2',
        time: '15 minutes ago',
        status: 'success',
      },
      {
        id: '3',
        type: 'fraud_blocked',
        message: 'Suspicious scan from VPN location blocked',
        time: '32 minutes ago',
        status: 'error',
      },
      {
        id: '4',
        type: 'campaign_paused',
        message: 'Campaign "Weekend Deals" paused due to budget limit',
        time: '1 hour ago',
        status: 'warning',
      },
      {
        id: '5',
        type: 'campaign_created',
        message: 'New campaign "Monsoon Special" created',
        time: '2 hours ago',
        status: 'info',
      },
      {
        id: '6',
        type: 'scan',
        message: 'QR code scanned at Express Avenue, Chennai',
        time: '3 hours ago',
        status: 'success',
      },
      {
        id: '7',
        type: 'conversion',
        message: 'Booking confirmed for Campaign #C3D4',
        time: '4 hours ago',
        status: 'success',
      },
      {
        id: '8',
        type: 'fraud_blocked',
        message: 'Duplicate scan from same device blocked',
        time: '5 hours ago',
        status: 'error',
      },
    ]

    if (!user) {
      return NextResponse.json(demoActivity)
    }

    const supabase = await createClient()

    // Get user's campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, booking_ids')
      .eq('buyer_id', user.id)

    const campaignIds = campaigns?.map(c => c.id) ?? []
    const campaignMap = new Map(campaigns?.map(c => [c.id, c.name]) ?? [])

    const activities: Array<{
      id: string
      type: string
      message: string
      time: string
      status: string
    }> = []

    // Get recent scans
    if (campaignIds.length > 0) {
      try {
        const { data: scans } = await supabase
          .from('qr_scans')
          .select('id, campaign_id, location, created_at, blocked')
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false })
          .limit(10)

        for (const scan of scans ?? []) {
          const campaignName = campaignMap.get(scan.campaign_id) ?? 'Unknown Campaign'
          activities.push({
            id: `scan-${scan.id}`,
            type: scan.blocked ? 'fraud_blocked' : 'scan',
            message: scan.blocked
              ? `Suspicious scan blocked at ${scan.location ?? 'unknown location'}`
              : `QR code scanned at ${scan.location ?? 'unknown location'}`,
            time: formatTimeAgo(scan.created_at),
            status: scan.blocked ? 'error' : 'success',
          })
        }
      } catch {
        // qr_scans table might not exist
      }

      // Get recent conversions (bookings)
      const allBookingIds = campaigns?.flatMap(c => c.booking_ids ?? []) ?? []
      if (allBookingIds.length > 0) {
        try {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('id, status, created_at')
            .in('id', allBookingIds)
            .in('status', ['confirmed', 'paid', 'completed'])
            .order('created_at', { ascending: false })
            .limit(5)

          for (const booking of bookings ?? []) {
            activities.push({
              id: `booking-${booking.id}`,
              type: 'conversion',
              message: `New booking confirmed: ${booking.id.slice(0, 8).toUpperCase()}`,
              time: formatTimeAgo(booking.created_at),
              status: 'success',
            })
          }
        } catch {
          // bookings query failed
        }
      }
    }

    // Get recent campaign changes
    try {
      const { data: recentCampaigns } = await supabase
        .from('campaigns')
        .select('id, name, status, updated_at')
        .eq('buyer_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      for (const campaign of recentCampaigns ?? []) {
        activities.push({
          id: `campaign-${campaign.id}`,
          type: campaign.status === 'active' ? 'campaign_created' : `campaign_${campaign.status}`,
          message: `Campaign "${campaign.name}" is now ${campaign.status}`,
          time: formatTimeAgo(campaign.updated_at),
          status: campaign.status === 'active' ? 'info' : campaign.status === 'paused' ? 'warning' : 'info',
        })
      }
    } catch {
      // campaigns query failed
    }

    // Sort by most recent and limit
    activities.sort((a, b) => {
      // Parse time strings for comparison (simplified)
      const getMinutes = (time: string) => {
        if (time.includes('minute')) return parseInt(time) || 0
        if (time.includes('hour')) return (parseInt(time) || 0) * 60
        if (time.includes('day')) return (parseInt(time) || 0) * 1440
        return 0
      }
      return getMinutes(a.time) - getMinutes(b.time)
    })

    return NextResponse.json(activities.slice(0, 10))
  } catch (e) {
    logger.error('GET /api/adbazaar/activity/recent error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}
