// Server-side only exports for API route authentication
// This file should only be imported in API routes, not in client components
export { withAuth, withStaffAuth, withManagerAuth, withAdminAuth, withSuperAdminAuth, withHIPAACompliance, createAuthenticatedRoute } from './src/middleware/appRouterAuth';
