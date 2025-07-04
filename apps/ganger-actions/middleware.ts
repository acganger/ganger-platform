import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Type for the app URL mappings
type AppUrls = {
  [key: string]: string;
};

// Fetch from Edge Config using the connection string
async function getFromEdgeConfig(key: string): Promise<any> {
  const edgeConfigUrl = process.env.EDGE_CONFIG_202507_1;
  console.log('Middleware: EDGE_CONFIG_202507_1 value:', edgeConfigUrl);
  if (!edgeConfigUrl) {
    console.error('Middleware: Edge Config URL not found');
    return null;
  }
  
  try {
    let url;
    try {
      url = new URL(edgeConfigUrl);
    } catch (e) {
      console.error('Middleware: Error parsing Edge Config URL:', e);
      return null;
    }
    const configId = url.pathname.slice(1); 
    const token = url.searchParams.get('token');
    
    console.log('Middleware: Fetching from Edge Config with ID:', configId, 'and token present:', !!token);
    const response = await fetch(`https://edge-config.vercel.com/api/v1/item/${key}?configId=${configId}&token=${token}`);
    
    if (!response.ok) {
      console.error('Middleware: Edge Config fetch failed with status:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    console.log('Middleware: Successfully fetched appUrls:', data);
    return data;
  } catch (error) {
    console.error('Middleware: Edge Config error during fetch:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Middleware: Incoming request for pathname:', pathname);
  
  try {
    const appUrls = await getFromEdgeConfig('appUrls') || {};
    console.log('Middleware: appUrls from Edge Config:', appUrls);
    
    for (const [appPath, appUrl] of Object.entries(appUrls)) {
      console.log('Middleware: Checking path:', pathname, 'against appPath:', appPath);
      if (pathname.startsWith(`/${appPath}`)) {
        const targetUrl = new URL(pathname, appUrl);
        targetUrl.search = request.nextUrl.search;
        
        console.log('Middleware: Original search params:', request.nextUrl.search);
        const hasAuthCookie = request.cookies.has('sb-pfqtzmxxxhhsxmlddrta-auth-token');
        console.log('Middleware: Has auth cookie:', hasAuthCookie);
        if (hasAuthCookie && !targetUrl.searchParams.has('sso')) {
          targetUrl.searchParams.set('sso', 'true');
          console.log('Middleware: Added sso param.');
        }
        
        console.log('Middleware: Rewriting to targetUrl:', targetUrl.toString());
        return NextResponse.rewrite(targetUrl);
      }
    }
    
    console.log('Middleware: No app match, continuing to staff portal.');
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware: Error in main middleware logic:', error);
    
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
    
    for (const [path, appName] of Object.entries(appMappings)) {
      if (pathname.startsWith(path)) {
        console.log('Middleware: Falling back to coming-soon for app:', appName);
        const url = request.nextUrl.clone();
        url.pathname = '/coming-soon';
        url.searchParams.set('app', appName);
        return NextResponse.rewrite(url);
      }
    }
    
    console.log('Middleware: No app match for coming-soon fallback, continuing.');
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