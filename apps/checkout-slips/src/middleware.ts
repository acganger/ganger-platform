import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Skip middleware for public assets and API routes that don't need auth
  if (
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname.startsWith('/favicon.ico') ||
    req.nextUrl.pathname.startsWith('/api/health')
  ) {
    return res;
  }

  try {
    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();

    // For API routes, check authentication
    if (req.nextUrl.pathname.startsWith('/api/')) {
      if (error || !session) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user is staff member
      const { data: staffUser, error: staffError } = await supabase
        .from('staff_users')
        .select('id, email, role, permissions, active')
        .eq('email', session.user.email)
        .eq('active', true)
        .single();

      if (staffError || !staffUser) {
        return NextResponse.json(
          { success: false, error: 'Staff access required' },
          { status: 403 }
        );
      }

      // Check if user has checkout-slips permission
      const permissions = staffUser.permissions as string[] || [];
      if (!permissions.includes('checkout-slips') && staffUser.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions for checkout slips' },
          { status: 403 }
        );
      }

      // Add user info to request headers for API routes
      res.headers.set('x-user-id', session.user.id);
      res.headers.set('x-user-email', session.user.email || '');
      res.headers.set('x-staff-id', staffUser.id);
      res.headers.set('x-staff-role', staffUser.role);
    }

    // For pages, redirect to login if not authenticated
    if (!session && !req.nextUrl.pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('returnTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication error' },
        { status: 500 }
      );
    }
    
    // Redirect to error page for non-API routes
    return NextResponse.redirect(new URL('/error', req.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};