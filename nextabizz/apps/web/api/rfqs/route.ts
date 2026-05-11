import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitHeaders, getRateLimitRecord } from '@/middleware/rateLimit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  const record = getRateLimitRecord(request);
  const headers = record ? getRateLimitHeaders(record) : {};

  return NextResponse.json({
    rfqs: [],
    message: 'RFQs API endpoint',
  }, { headers });
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();

    // Basic input validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    // Validate required fields for RFQ creation
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'RFQ title is required' }, { status: 400 });
    }

    if (!body.quantity || typeof body.quantity !== 'number' || body.quantity <= 0) {
      return NextResponse.json({ success: false, error: 'Valid quantity is required' }, { status: 400 });
    }

    console.log('Create RFQ:', { ...body, title: body.title }); // Log sanitized data

    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Create RFQ error:', errorMessage);
    return NextResponse.json({ success: false, error: 'Failed to create RFQ' }, { status: 500 });
  }
}
