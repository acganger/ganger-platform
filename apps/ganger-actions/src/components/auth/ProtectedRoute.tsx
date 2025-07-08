// Use @ganger/auth guards instead of custom ProtectedRoute
import { AuthGuard, StaffOnly, AdminOnly } from '@ganger/auth';
import { AuthUser } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AuthUser['role'];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  // Map legacy role requirements to @ganger/auth guards
  if (requiredRole === 'admin') {
    return <AdminOnly>{children}</AdminOnly>;
  }
  
  if (requiredRole === 'staff' || requiredRole === 'manager') {
    return <StaffOnly>{children}</StaffOnly>;
  }
  
  // Default: require authentication
  return <AuthGuard level="authenticated">{children}</AuthGuard>;
};

// Re-export @ganger/auth guards for direct use
export { AuthGuard, StaffOnly, AdminOnly } from '@ganger/auth';