// Cloudflare Workers Edge Runtime
export const runtime = 'experimental-edge';

import { NextRequest, NextResponse } from 'next/server';

export default function handler(req: NextRequest) {
  return NextResponse.json({
    status: 'success',
    message: 'Dynamic Worker API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    deployment: 'fresh-worker-only'
  });
}