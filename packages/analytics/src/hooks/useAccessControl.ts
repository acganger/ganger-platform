import { useStaffAuth } from '@ganger/auth/staff';

export function useAccessControl() {
  const { user, profile } = useStaffAuth();

  const isManager = profile?.organizational_unit === 'managers';
  const isAdmin = profile?.role === 'admin';
  
  const canViewAllMetrics = isManager || isAdmin;
  const canExportData = isManager || isAdmin;
  const canViewFinancialMetrics = isManager || isAdmin || profile?.role === 'billing';
  const canViewStaffMetrics = isManager || isAdmin || profile?.role === 'hr';
  const canViewClinicalMetrics = isManager || isAdmin || profile?.role === 'clinical';
  
  return {
    isManager,
    isAdmin,
    canViewAllMetrics,
    canExportData,
    canViewFinancialMetrics,
    canViewStaffMetrics,
    canViewClinicalMetrics,
    user,
    profile,
  };
}