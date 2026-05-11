import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRedis } from '@/lib/redis';

const REZ_AUTH_URL = process.env.REZ_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const REDIRECT_URI = process.env.REZ_OAUTH_REDIRECT_URI || 'https://ad-bazaar.vercel.app/api/auth/rez-callback';
const REZ_CLIENT_ID = process.env.REZ_OAUTH_CLIENT_ID || 'adbazaar';

const OAUTH_STATE_TTL = 10 * 60;

type OAuthState = Map<string, { createdAt: number; destination: string | null }>;
declare global {
  var adbazaarOAuthState: OAuthState | undefined;
}

export async function GET(req: NextRequest) {
  const redis = getRedis();
  const state = crypto.randomBytes(16).toString('hex');
  const dest = req.nextUrl.searchParams.get('dest') || '/';

  if (redis) {
    await redis.set(`oauth:state:${state}`, JSON.stringify({ destination: dest }), { ex: OAUTH_STATE_TTL });
  } else {
    global.adbazaarOAuthState = global.adbazaarOAuthState || new Map();
    global.adbazaarOAuthState.set(state, { createdAt: Date.now(), destination: dest });
  }

  const params = new URLSearchParams({
    client_id: REZ_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'profile wallet:read',
    state,
  });

  return NextResponse.redirect(`${REZ_AUTH_URL}/oauth/authorize?${params.toString()}`);
}
