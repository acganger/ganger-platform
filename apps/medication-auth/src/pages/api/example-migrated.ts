import { NextApiResponse } from 'next';
import { 
  withAuth, 
  AuthenticatedRequest,
  withStaffAuth,
  withManagerAuth,
  withHIPAACompliance,
  respondWithSuccess,
  respondWithError,
  ErrorCodes,
  withStandardErrorHandling
} from '../../lib/utils/mock-response-utils';
import { 
  withRateLimit, 
  RateLimits
} from '../../lib/utils/mock-health-check';

// Example 1: Basic authenticated endpoint
async function basicHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user } = req;
  
  return respondWithSuccess(res, {
    message: 'Hello authenticated user!',
    user: {
      id: user.id,
      email: user?.email,
      role: user.role
    }
  });
}

// Example 2: HIPAA-compliant patient data access
async function patientDataHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user } = req;
  const patientId = req.query.id as string;
  
  // Check if user can access this patient's data
  const canAccess = user.role === 'superadmin' || 
                   user.permissions.includes('read:patient_data');
  
  if (!canAccess) {
    return respondWithError(
      res,
      'Access to patient data denied',
      403,
      ErrorCodes.PHI_ACCESS_DENIED,
      req,
      { patientId, userRole: user.role }
    );
  }
  
  // Simulate patient data access
  const patientData = {
    id: patientId,
    name: 'John Doe',
    dob: '1990-01-01',
    // ... other PHI data
  };
  
  return respondWithSuccess(res, patientData);
}

// Example 3: AI processing with role and rate limiting
async function aiProcessingHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user } = req;
  
  // AI processing logic here
  const result = {
    analysisId: 'ai-123',
    result: 'analysis complete',
    processedBy: user.id,
    processingTime: '2.3s'
  };
  
  return respondWithSuccess(res, result);
}

// Example 4: Manager-only administrative function
async function adminHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { user } = req;
  
  const adminData = {
    systemStats: {
      totalUsers: 150,
      activeUsers: 142,
      totalRequests: 5420
    },
    requestedBy: user?.email
  };
  
  return respondWithSuccess(res, adminData);
}

// Export different authentication patterns

// Basic authentication with standard rate limiting
export const basicAuth = withStandardErrorHandling(
  withAuth(
    withRateLimit(basicHandler, RateLimits.STANDARD),
    {
      roles: ['staff', 'manager', 'superadmin'],
      auditLog: true
    }
  )
);

// HIPAA-compliant patient data access
export const patientDataAuth = withStandardErrorHandling(
  withHIPAACompliance(patientDataHandler, {
    roles: ['clinical_staff', 'manager', 'superadmin'],
    permissions: [
      { permission: 'read', resource: 'patient_data' }
    ],
    requireMFA: true
  })
);

// AI processing with strict rate limiting
export const aiProcessingAuth = withStandardErrorHandling(
  withAuth(
    withRateLimit(aiProcessingHandler, RateLimits.AI_PROCESSING),
    {
      roles: ['clinical_staff', 'manager'],
      hipaaCompliant: true,
      auditLog: true
    }
  )
);

// Manager-only access (using convenience middleware)
export const managerAuthEndpoint = withStandardErrorHandling(
  withManagerAuth(adminHandler) // Fixed function name reference
);

// Staff access (using convenience middleware)
export const staffAuth = withStandardErrorHandling(
  withStaffAuth(basicHandler)
);

// Default export for the API route
export default basicAuth;
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
