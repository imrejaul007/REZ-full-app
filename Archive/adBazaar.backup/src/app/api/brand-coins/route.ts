import { NextRequest, NextResponse } from 'next/server'

// Types
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

// Mock data
const brandCoins: BrandCoin[] = [
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
    logo: 'FK',
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
    logo: 'SW',
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
    logo: 'MY',
    status: 'expired',
  },
]

const distributions: Distribution[] = [
  { id: 'd1', coinId: 'coin_001', coinSymbol: 'FKTS', amount: 100, recipient: 'Rahul Sharma', recipientEmail: 'rahul@example.com', timestamp: '2024-08-15T14:32:00Z', campaign: 'Summer Sale' },
  { id: 'd2', coinId: 'coin_001', coinSymbol: 'FKTS', amount: 250, recipient: 'Priya Patel', recipientEmail: 'priya@example.com', timestamp: '2024-08-15T13:15:00Z', campaign: 'Flash Sale' },
  { id: 'd3', coinId: 'coin_002', coinSymbol: 'SWIG', amount: 50, recipient: 'Amit Kumar', recipientEmail: 'amit@example.com', timestamp: '2024-08-15T11:45:00Z', campaign: 'Food Festival' },
  { id: 'd4', coinId: 'coin_002', coinSymbol: 'SWIG', amount: 100, recipient: 'Sneha Reddy', recipientEmail: 'sneha@example.com', timestamp: '2024-08-15T10:20:00Z', campaign: 'Weekend Deals' },
]

const redemptions: Redemption[] = [
  { id: 'r1', coinSymbol: 'FKTS', amount: 500, user: 'Rahul S.', reward: '₹500 Off Coupon', timestamp: '2024-08-15T16:00:00Z', status: 'completed' },
  { id: 'r2', coinSymbol: 'FKTS', amount: 200, user: 'Priya P.', reward: 'Free Delivery', timestamp: '2024-08-15T15:30:00Z', status: 'completed' },
  { id: 'r3', coinSymbol: 'SWIG', amount: 150, user: 'Amit K.', reward: '₹75 Off', timestamp: '2024-08-15T14:00:00Z', status: 'pending' },
]

// GET /api/brand-coins
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const coinId = searchParams.get('coinId')

  try {
    switch (endpoint) {
      case 'list':
        return NextResponse.json({
          success: true,
          data: {
            coins: brandCoins,
            total: brandCoins.length,
            stats: {
              totalCreated: brandCoins.reduce((sum, c) => sum + c.totalSupply, 0),
              totalDistributed: brandCoins.reduce((sum, c) => sum + c.distributed, 0),
              totalRedeemed: brandCoins.reduce((sum, c) => sum + c.redeemed, 0),
            },
          },
        })

      case 'coin':
        if (!coinId) {
          return NextResponse.json(
            { success: false, error: 'Coin ID required' },
            { status: 400 }
          )
        }
        const coin = brandCoins.find((c) => c.id === coinId)
        if (!coin) {
          return NextResponse.json(
            { success: false, error: 'Coin not found' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          data: coin,
        })

      case 'distributions':
        return NextResponse.json({
          success: true,
          data: {
            items: distributions,
            total: distributions.length,
          },
        })

      case 'redemptions':
        return NextResponse.json({
          success: true,
          data: {
            items: redemptions,
            total: redemptions.length,
          },
        })

      case 'distribution':
        if (!coinId) {
          return NextResponse.json(
            { success: false, error: 'Coin ID required' },
            { status: 400 }
          )
        }
        const coinDistributions = distributions.filter((d) => d.coinId === coinId)
        return NextResponse.json({
          success: true,
          data: {
            items: coinDistributions,
            total: coinDistributions.length,
          },
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            coins: brandCoins,
            recentDistributions: distributions.slice(0, 10),
            recentRedemptions: redemptions.slice(0, 10),
          },
        })
    }
  } catch (error) {
    console.error('Brand Coins API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/brand-coins
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    const body = await request.json()

    switch (action) {
      case 'create':
        const newCoin: BrandCoin = {
          id: `coin_${Date.now()}`,
          name: body.name,
          symbol: body.symbol.toUpperCase(),
          value: parseFloat(body.value) || 1,
          totalSupply: parseInt(body.totalSupply) || 0,
          distributed: 0,
          redeemed: 0,
          createdAt: new Date().toISOString().split('T')[0],
          expiresAt: body.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          logo: body.symbol.substring(0, 2).toUpperCase(),
          status: 'active',
        }
        brandCoins.push(newCoin)
        return NextResponse.json({
          success: true,
          data: newCoin,
          message: 'Brand coin created successfully',
        })

      case 'distribute':
        const { coinId, amount, recipient, recipientEmail, campaign } = body
        if (!coinId || !amount || !recipient) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          )
        }
        const coin = brandCoins.find((c) => c.id === coinId)
        if (!coin) {
          return NextResponse.json(
            { success: false, error: 'Coin not found' },
            { status: 404 }
          )
        }
        if (coin.distributed + amount > coin.totalSupply) {
          return NextResponse.json(
            { success: false, error: 'Insufficient supply' },
            { status: 400 }
          )
        }
        coin.distributed += amount
        const distribution: Distribution = {
          id: `d_${Date.now()}`,
          coinId,
          coinSymbol: coin.symbol,
          amount,
          recipient,
          recipientEmail: recipientEmail || '',
          timestamp: new Date().toISOString(),
          campaign: campaign || '',
        }
        distributions.unshift(distribution)
        return NextResponse.json({
          success: true,
          data: { coin, distribution },
          message: 'Coins distributed successfully',
        })

      case 'redeem':
        const { redemptionCoinSymbol, redemptionAmount, user, reward } = body
        if (!redemptionCoinSymbol || !redemptionAmount || !user || !reward) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          )
        }
        const redemption: Redemption = {
          id: `r_${Date.now()}`,
          coinSymbol: redemptionCoinSymbol,
          amount: parseInt(redemptionAmount),
          user,
          reward,
          timestamp: new Date().toISOString(),
          status: 'completed',
        }
        redemptions.unshift(redemption)
        return NextResponse.json({
          success: true,
          data: redemption,
          message: 'Redemption processed successfully',
        })

      case 'update':
        const { updateId, updates } = body
        if (!updateId) {
          return NextResponse.json(
            { success: false, error: 'Coin ID required' },
            { status: 400 }
          )
        }
        const coinIndex = brandCoins.findIndex((c) => c.id === updateId)
        if (coinIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Coin not found' },
            { status: 404 }
          )
        }
        brandCoins[coinIndex] = { ...brandCoins[coinIndex], ...updates }
        return NextResponse.json({
          success: true,
          data: brandCoins[coinIndex],
          message: 'Coin updated successfully',
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Brand Coins API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
