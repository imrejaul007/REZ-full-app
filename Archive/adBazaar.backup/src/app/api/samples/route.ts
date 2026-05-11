import { NextRequest, NextResponse } from 'next/server'

// Types
interface Sample {
  id: string
  name: string
  description: string
  category: string
  quantity: number
  available: number
  claimed: number
  image: string
  expiryDate: string
  status: 'active' | 'paused' | 'out_of_stock'
}

interface SampleRequest {
  id: string
  sampleId: string
  sampleName: string
  userName: string
  userEmail: string
  userPhone: string
  pickupLocation: string
  requestedAt: string
  status: 'pending' | 'approved' | 'ready' | 'claimed' | 'expired'
  qrCode: string
}

// Mock data
const samples: Sample[] = [
  {
    id: 'samp_001',
    name: 'Premium Face Serum Trial',
    description: 'Free 7-day trial of our bestselling vitamin C serum',
    category: 'Beauty',
    quantity: 500,
    available: 234,
    claimed: 266,
    image: 'serum',
    expiryDate: '2024-12-31',
    status: 'active',
  },
  {
    id: 'samp_002',
    name: 'Organic Coffee Beans',
    description: 'Sample pack of single-origin arabica beans',
    category: 'Food',
    quantity: 200,
    available: 89,
    claimed: 111,
    image: 'coffee',
    expiryDate: '2024-10-15',
    status: 'active',
  },
  {
    id: 'samp_003',
    name: 'Wireless Earbuds',
    description: 'Premium wireless earbuds with active noise cancellation',
    category: 'Electronics',
    quantity: 100,
    available: 0,
    claimed: 100,
    image: 'earbuds',
    expiryDate: '2024-08-30',
    status: 'out_of_stock',
  },
  {
    id: 'samp_004',
    name: 'Protein Bar Pack',
    description: 'Assorted pack of 5 protein bars, chocolate & peanut butter',
    category: 'Health',
    quantity: 300,
    available: 156,
    claimed: 144,
    image: 'protein',
    expiryDate: '2024-11-20',
    status: 'active',
  },
]

const requests: SampleRequest[] = [
  { id: 'req_001', sampleId: 'samp_001', sampleName: 'Premium Face Serum Trial', userName: 'Priya Sharma', userEmail: 'priya@example.com', userPhone: '+91 98765 43210', pickupLocation: 'Phoenix Mall, Bangalore', requestedAt: '2024-08-15T14:30:00Z', status: 'ready', qrCode: 'QR_Priya_001' },
  { id: 'req_002', sampleId: 'samp_002', sampleName: 'Organic Coffee Beans', userName: 'Rahul Kumar', userEmail: 'rahul@example.com', userPhone: '+91 87654 32109', pickupLocation: 'Orion Mall, Bangalore', requestedAt: '2024-08-15T12:15:00Z', status: 'approved', qrCode: 'QR_Rahul_002' },
  { id: 'req_003', sampleId: 'samp_004', sampleName: 'Protein Bar Pack', userName: 'Amit Patel', userEmail: 'amit@example.com', userPhone: '+91 76543 21098', pickupLocation: 'Forum Mall, Bangalore', requestedAt: '2024-08-15T10:45:00Z', status: 'pending', qrCode: 'QR_Amit_003' },
  { id: 'req_004', sampleId: 'samp_001', sampleName: 'Premium Face Serum Trial', userName: 'Sneha Reddy', userEmail: 'sneha@example.com', userPhone: '+91 65432 10987', pickupLocation: 'UB City, Bangalore', requestedAt: '2024-08-14T16:20:00Z', status: 'claimed', qrCode: 'QR_Sneha_004' },
]

// GET /api/samples
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  const sampleId = searchParams.get('sampleId')
  const requestId = searchParams.get('requestId')
  const status = searchParams.get('status')

  try {
    switch (endpoint) {
      case 'list':
        let filteredSamples = samples
        if (status) {
          filteredSamples = samples.filter((s) => s.status === status)
        }
        return NextResponse.json({
          success: true,
          data: {
            items: filteredSamples,
            total: filteredSamples.length,
            stats: {
              totalSamples: samples.length,
              available: samples.reduce((sum, s) => sum + s.available, 0),
              claimed: samples.reduce((sum, s) => sum + s.claimed, 0),
            },
          },
        })

      case 'sample':
        if (!sampleId) {
          return NextResponse.json(
            { success: false, error: 'Sample ID required' },
            { status: 400 }
          )
        }
        const sample = samples.find((s) => s.id === sampleId)
        if (!sample) {
          return NextResponse.json(
            { success: false, error: 'Sample not found' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          data: sample,
        })

      case 'requests':
        let filteredRequests = requests
        if (status) {
          filteredRequests = requests.filter((r) => r.status === status)
        }
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const start = (page - 1) * limit
        const end = start + limit
        return NextResponse.json({
          success: true,
          data: {
            items: filteredRequests.slice(start, end),
            total: filteredRequests.length,
            page,
            limit,
            totalPages: Math.ceil(filteredRequests.length / limit),
            stats: {
              pending: requests.filter((r) => r.status === 'pending').length,
              approved: requests.filter((r) => r.status === 'approved').length,
              ready: requests.filter((r) => r.status === 'ready').length,
              claimed: requests.filter((r) => r.status === 'claimed').length,
            },
          },
        })

      case 'request':
        if (!requestId) {
          return NextResponse.json(
            { success: false, error: 'Request ID required' },
            { status: 400 }
          )
        }
        const req = requests.find((r) => r.id === requestId)
        if (!req) {
          return NextResponse.json(
            { success: false, error: 'Request not found' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          data: req,
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            samples: samples.slice(0, 10),
            recentRequests: requests.slice(0, 10),
            stats: {
              totalSamples: samples.length,
              available: samples.reduce((sum, s) => sum + s.available, 0),
              claimed: samples.reduce((sum, s) => sum + s.claimed, 0),
              pendingRequests: requests.filter((r) => r.status === 'pending').length,
            },
          },
        })
    }
  } catch (error) {
    console.error('Samples API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/samples
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    const body = await request.json()

    switch (action) {
      case 'create':
        const newSample: Sample = {
          id: `samp_${Date.now()}`,
          name: body.name,
          description: body.description || '',
          category: body.category || 'General',
          quantity: parseInt(body.quantity) || 0,
          available: parseInt(body.quantity) || 0,
          claimed: 0,
          image: body.image || 'default',
          expiryDate: body.expiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
        }
        samples.push(newSample)
        return NextResponse.json({
          success: true,
          data: newSample,
          message: 'Sample created successfully',
        })

      case 'request':
        const { sampleId, userName, userEmail, userPhone, pickupLocation } = body
        if (!sampleId || !userName || !pickupLocation) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          )
        }
        const requestedSample = samples.find((s) => s.id === sampleId)
        if (!requestedSample) {
          return NextResponse.json(
            { success: false, error: 'Sample not found' },
            { status: 404 }
          )
        }
        if (requestedSample.available <= 0) {
          return NextResponse.json(
            { success: false, error: 'Sample out of stock' },
            { status: 400 }
          )
        }
        const newRequest: SampleRequest = {
          id: `req_${Date.now()}`,
          sampleId,
          sampleName: requestedSample.name,
          userName,
          userEmail: userEmail || '',
          userPhone: userPhone || '',
          pickupLocation,
          requestedAt: new Date().toISOString(),
          status: 'pending',
          qrCode: `QR_${userName.replace(/\s/g, '_')}_${Date.now()}`,
        }
        requests.unshift(newRequest)
        return NextResponse.json({
          success: true,
          data: newRequest,
          message: 'Sample request submitted successfully',
        })

      case 'update-status':
        const { requestId: updateRequestId, newStatus } = body
        if (!updateRequestId || !newStatus) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields' },
            { status: 400 }
          )
        }
        const reqIndex = requests.findIndex((r) => r.id === updateRequestId)
        if (reqIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Request not found' },
            { status: 404 }
          )
        }
        const oldStatus = requests[reqIndex].status
        requests[reqIndex].status = newStatus

        // Update sample inventory when claimed
        if (newStatus === 'claimed' && oldStatus !== 'claimed') {
          const sampleIndex = samples.findIndex((s) => s.id === requests[reqIndex].sampleId)
          if (sampleIndex !== -1) {
            samples[sampleIndex].available = Math.max(0, samples[sampleIndex].available - 1)
            samples[sampleIndex].claimed += 1
            if (samples[sampleIndex].available === 0) {
              samples[sampleIndex].status = 'out_of_stock'
            }
          }
        }

        return NextResponse.json({
          success: true,
          data: requests[reqIndex],
          message: `Request status updated to ${newStatus}`,
        })

      case 'update':
        const { sampleId: updateSampleId, updates } = body
        if (!updateSampleId) {
          return NextResponse.json(
            { success: false, error: 'Sample ID required' },
            { status: 400 }
          )
        }
        const sampleIndex = samples.findIndex((s) => s.id === updateSampleId)
        if (sampleIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Sample not found' },
            { status: 404 }
          )
        }
        samples[sampleIndex] = { ...samples[sampleIndex], ...updates }
        return NextResponse.json({
          success: true,
          data: samples[sampleIndex],
          message: 'Sample updated successfully',
        })

      case 'delete':
        const { sampleId: deleteSampleId } = body
        if (!deleteSampleId) {
          return NextResponse.json(
            { success: false, error: 'Sample ID required' },
            { status: 400 }
          )
        }
        const deleteIndex = samples.findIndex((s) => s.id === deleteSampleId)
        if (deleteIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Sample not found' },
            { status: 404 }
          )
        }
        samples.splice(deleteIndex, 1)
        return NextResponse.json({
          success: true,
          message: 'Sample deleted successfully',
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Samples API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
