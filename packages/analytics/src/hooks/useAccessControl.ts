import { useStaffAuth } from '@ganger/auth';

export function useAccessControl() {
  const { user, profile } = useStaffAuth();

  const isManager = profile?.department === 'management';
  const isAdmin = profile?.role === 'admin';
  
  const canViewAllMetrics = isManager || isAdmin;
  const canExportData = isManager || isAdmin;
  const canViewFinancialMetrics = isManager || isAdmin || profile?.department === 'billing';
  const canViewStaffMetrics = isManager || isAdmin || profile?.department === 'hr';
  const canViewClinicalMetrics = isManager || isAdmin || profile?.department === 'clinical';
  
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