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

// GET /api/adbazaar/dashboard/stats — get dashboard statistics for adBazaar
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req)
    if (!user) {
      // Return demo data for unauthenticated requests (development)
      return NextResponse.json({
        totalScans: 45678,
        totalConversions: 892,
        totalCampaigns: 5,
        totalSpend: 125000,
        conversionsToday: 23,
        scansToday: 1245,
        revenue: 342500,
        roi: 18.5,
      })
    }

    const supabase = await createClient()

    // Get campaigns count
    const { count: campaignCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id)

    // Get all campaigns for the user to calculate stats
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, booking_ids, total_spent')
      .eq('buyer_id', user.id)

    const campaignIds = campaigns?.map(c => c.id) ?? []
    const totalSpend = campaigns?.reduce((sum, c) => sum + Number(c.total_spent ?? 0), 0) ?? 0

    // Get scan count from qr_scans table (if exists)
    let totalScans = 0
    let scansToday = 0
    const today = new Date().toISOString().split('T')[0]

    try {
      if (campaignIds.length > 0) {
        const { count: scanCount } = await supabase
          .from('qr_scans')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
        totalScans = scanCount ?? 0

        const { count: todayScanCount } = await supabase
          .from('qr_scans')
          .select('*', { count: 'exact', head: true })
          .in('campaign_id', campaignIds)
          .gte('created_at', today)
        scansToday = todayScanCount ?? 0
      }
    } catch {
      // qr_scans table might not exist yet
    }

    // Get conversion count from bookings
    let totalConversions = 0
    let conversionsToday = 0

    try {
      const allBookingIds = campaigns?.flatMap(c => c.booking_ids ?? []) ?? []

      if (allBookingIds.length > 0) {
        const { count: convCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('id', allBookingIds)
          .in('status', ['confirmed', 'paid', 'completed'])
        totalConversions = convCount ?? 0

        const { count: todayConvCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('id', allBookingIds)
          .in('status', ['confirmed', 'paid', 'completed'])
          .gte('created_at', today)
        conversionsToday = todayConvCount ?? 0
      }
    } catch {
      // bookings table query failed
    }

    // Calculate revenue (sum of booking amounts)
    let revenue = 0
    try {
      const allBookingIds = campaigns?.flatMap(c => c.booking_ids ?? []) ?? []
      if (allBookingIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('amount')
          .in('id', allBookingIds)
          .in('status', ['confirmed', 'paid', 'completed'])
        revenue = bookings?.reduce((sum, b) => sum + Number(b.amount ?? 0), 0) ?? 0
      }
    } catch {
      // bookings query failed
    }

    // Calculate ROI
    const roi = totalSpend > 0 ? ((revenue - totalSpend) / totalSpend) * 100 : 0

    return NextResponse.json({
      totalScans,
      totalConversions,
      totalCampaigns: campaignCount ?? 0,
      totalSpend,
      conversionsToday,
      scansToday,
      revenue,
      roi,
    })
  } catch (e) {
    logger.error('GET /api/adbazaar/dashboard/stats error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
