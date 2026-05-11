import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, notes } = body

    // In production: call backend to create Razorpay order
    // const order = await createRazorpayOrder(amount, notes)

    // Mock response for development
    const mockOrder = {
      razorpayOrderId: `order_${Date.now()}`,
      amount: amount * 100,
      currency: 'INR',
      status: 'created',
    }

    return NextResponse.json(mockOrder)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
