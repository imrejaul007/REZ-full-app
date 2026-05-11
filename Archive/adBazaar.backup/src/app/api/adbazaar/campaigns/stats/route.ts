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

// GET /api/adbazaar/campaigns/stats — get campaign statistics for dashboard
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req)

    // Demo data for development or when not authenticated
    const demoCampaigns = [
      {
        id: 'A1B2',
        name: 'Summer Sale 2024',
        status: 'active',
        scans: 12450,
        conversions: 342,
        roi: 24.5,
      },
      {
        id: 'C3D4',
        name: 'Monsoon Offers',
        status: 'active',
        scans: 8932,
        conversions: 189,
        roi: 18.2,
      },
      {
        id: 'E5F6',
        name: 'Festival Special',
        status: 'paused',
        scans: 5621,
        conversions: 98,
        roi: 12.1,
      },
      {
        id: 'G7H8',
        name: 'Weekend Deals',
        status: 'active',
        scans: 3205,
        conversions: 87,
        roi: 15.8,
      },
      {
        id: 'I9J0',
        name: 'Flash Sale',
        status: 'completed',
        scans: 15432,
        conversions: 456,
        roi: 28.3,
      },
    ]

    if (!user) {
      return NextResponse.json(demoCampaigns)
    }

    const supabase = await createClient()

    // Get all campaigns for the user
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, status, total_spent, booking_ids')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch campaigns', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with stats
    const enrichedCampaigns = await Promise.all(
      (campaigns ?? []).map(async (campaign) => {
        let scans = 0
        let conversions = 0
        const bookingIds = campaign.booking_ids ?? []

        // Get scan count
        try {
          const { count } = await supabase
            .from('qr_scans')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
          scans = count ?? 0
        } catch {
          // qr_scans table might not exist
        }

        // Get conversion count from bookings
        if (bookingIds.length > 0) {
          try {
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .in('id', bookingIds)
              .in('status', ['confirmed', 'paid', 'completed'])
            conversions = count ?? 0
          } catch {
            // bookings query failed
          }
        }

        const revenue = 0 // Calculate from bookings if needed
        const spent = Number(campaign.total_spent ?? 0)
        const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0

        return {
          id: campaign.id.slice(0, 8).toUpperCase(),
          name: campaign.name,
          status: campaign.status,
          scans,
          conversions,
          roi,
        }
      })
    )

    return NextResponse.json(enrichedCampaigns)
  } catch (e) {
    logger.error('GET /api/adbazaar/campaigns/stats error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
