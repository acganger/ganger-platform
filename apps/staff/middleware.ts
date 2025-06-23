import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Map of app routes to their Vercel deployment URLs
// These will be updated once each app is deployed
const APP_ROUTES: Record<string, string> = {
  '/inventory': process.env.INVENTORY_APP_URL || 'http://localhost:3001',
  '/handouts': process.env.HANDOUTS_APP_URL || 'http://localhost:3002',
  '/meds': process.env.MEDS_APP_URL || 'http://localhost:3003',
  '/kiosk': process.env.KIOSK_APP_URL || 'http://localhost:3004',
  '/l10': process.env.L10_APP_URL || 'http://localhost:3005',
  '/compliance': process.env.COMPLIANCE_APP_URL || 'http://localhost:3006',
  '/staffing': process.env.STAFFING_APP_URL || 'http://localhost:3007',
  '/socials': process.env.SOCIALS_APP_URL || 'http://localhost:3008',
  '/config': process.env.CONFIG_APP_URL || 'http://localhost:3009',
  '/status': process.env.STATUS_APP_URL || 'http://localhost:3010',
  '/ai-receptionist': process.env.AI_RECEPTIONIST_APP_URL || 'http://localhost:3011',
  '/call-center': process.env.CALL_CENTER_APP_URL || 'http://localhost:3012',
  '/reps': process.env.REPS_APP_URL || 'http://localhost:3013',
  '/showcase': process.env.SHOWCASE_APP_URL || 'http://localhost:3014',
  '/batch': process.env.BATCH_APP_URL || 'http://localhost:3015',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request matches any app route
  for (const [route, appUrl] of Object.entries(APP_ROUTES)) {
    if (pathname.startsWith(route)) {
      // Rewrite to the app's deployment URL
      const url = new URL(pathname, appUrl);
      url.search = request.nextUrl.search;
      
      return NextResponse.rewrite(url);
    }
  }
  
  // Continue with normal request processing
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/inventory/:path*',
    '/handouts/:path*',
    '/meds/:path*',
    '/kiosk/:path*',
    '/l10/:path*',
    '/compliance/:path*',
    '/staffing/:path*',
    '/socials/:path*',
    '/config/:path*',
    '/status/:path*',
    '/ai-receptionist/:path*',
    '/call-center/:path*',
    '/reps/:path*',
    '/showcase/:path*',
    '/batch/:path*',
  ],
};