import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Type for the app URL mappings
type AppUrls = {
  [key: string]: string;
};

// Fetch from Edge Config using the connection string
async function getFromEdgeConfig(key: string): Promise<any> {
  const edgeConfigUrl = process.env.EDGE_CONFIG || process.env.EDGE_CONFI;
  if (!edgeConfigUrl) {
    console.error('Edge Config URL not found');
    return null;
  }
  
  try {
    // Extract the config ID and token from the URL
    const url = new URL(edgeConfigUrl);
    const configId = url.pathname.slice(1); // Remove leading /
    const token = url.searchParams.get('token');
    
    // Fetch from Edge Config API
    const response = await fetch(`https://edge-config.vercel.com/api/v1/item/${key}?configId=${configId}&token=${token}`);
    if (!response.ok) {
      console.error('Edge Config fetch failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Edge Config error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Get app mappings from Edge Config
    const appUrls = await getFromEdgeConfig('appUrls') || {};
    
    // Check if the pathname matches any app route
    for (const [appPath, appUrl] of Object.entries(appUrls)) {
      if (pathname.startsWith(`/${appPath}`)) {
        // Rewrite to the target app URL
        const targetUrl = new URL(pathname, appUrl);
        
        // Copy search params
        targetUrl.search = request.nextUrl.search;
        
        // Add SSO parameter if user is authenticated
        const hasAuthCookie = request.cookies.has('sb-pfqtzmxxxhhsxmlddrta-auth-token');
        if (hasAuthCookie && !targetUrl.searchParams.has('sso')) {
          targetUrl.searchParams.set('sso', 'true');
        }
        
        return NextResponse.rewrite(targetUrl);
      }
    }
    
    // If no match, continue to the staff portal
    return NextResponse.next();
  } catch (error) {
    // If Edge Config fails, fall back to coming soon pages
    console.error('Edge Config error:', error);
    
    // Map of app paths to app names for coming soon fallback
    const appMappings: Record<string, string> = {
      '/inventory': 'inventory',
      '/handouts': 'handouts',
      '/l10': 'eos-l10',
      '/eos-l10': 'eos-l10',
      '/batch': 'batch-closeout',
      '/batch-closeout': 'batch-closeout',
      '/compliance': 'compliance-training',
      '/compliance-training': 'compliance-training',
      '/clinical-staffing': 'clinical-staffing',
      '/config': 'config-dashboard',
      '/config-dashboard': 'config-dashboard',
      '/status': 'integration-status',
      '/integration-status': 'integration-status',
      '/ai-receptionist': 'ai-receptionist',
      '/call-center': 'call-center-ops',
      '/call-center-ops': 'call-center-ops',
      '/medication-auth': 'medication-auth',
      '/pharma': 'pharma-scheduling',
      '/pharma-scheduling': 'pharma-scheduling',
      '/lunch': 'pharma-scheduling',
      '/kiosk': 'checkin-kiosk',
      '/checkin-kiosk': 'checkin-kiosk',
      '/socials': 'socials-reviews',
      '/socials-reviews': 'socials-reviews',
      '/component-showcase': 'component-showcase',
      '/components': 'component-showcase',
      '/platform-dashboard': 'platform-dashboard'
    };
    
    // Check if path matches any app
    for (const [path, appName] of Object.entries(appMappings)) {
      if (pathname.startsWith(path)) {
        const url = request.nextUrl.clone();
        url.pathname = '/coming-soon';
        url.searchParams.set('app', appName);
        return NextResponse.rewrite(url);
      }
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - static files
     * - image optimization files
     * - favicon.ico
     * - home page
     */
    '/((?!api|_next/static|_next/image|favicon.ico|$).*)',
  ]
};