import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter } from '@ganger/db';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler 
} from '@/lib/api/errors';
import { logger } from '@/lib/api/logger';

// Configure migration adapter
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  
  if (req.method !== 'GET') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const userEmail = session.user.email;
  logger.logRequest(req, userEmail);

  try {
    // Fetch staff members from database using migration adapter
    const staffMembers = await migrationAdapter.select(
      'staff_members',
      `
        *,
        profile:profiles!staff_members_profile_id_fkey(
          full_name,
          avatar_url,
          phone,
          bio
        )
      `,
      {
        employee_status: ['active', 'vacation', 'sick_leave', 'remote']
      },
      {
        orderBy: 'full_name'
      }
    );

    // Transform data to match frontend interface
    const transformedStaff = staffMembers.map((member: any) => ({
      id: member.id,
      name: member.full_name || member.email.split('@')[0],
      email: member.email,
      phone: member.profile?.phone || null,
      position: member.position || 'Staff Member',
      department: member.department || 'General',
      location: member.location || 'Main Office',
      startDate: member.hire_date || member.created_at,
      manager: member.manager_name || null,
      team: member.team || null,
      status: mapEmployeeStatus(member.employee_status),
      avatar: member.profile?.avatar_url || null,
      bio: member.profile?.bio || null,
      skills: member.skills || []
    }));

    sendSuccess(res, {
      staff: transformedStaff,
      total: transformedStaff.length
    });
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  } finally {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res.statusCode, duration);
  }
});

// Map database employee status to UI status
function mapEmployeeStatus(dbStatus: string): 'active' | 'vacation' | 'sick' | 'remote' {
  const statusMap: Record<string, 'active' | 'vacation' | 'sick' | 'remote'> = {
    'active': 'active',
    'vacation': 'vacation',
    'sick_leave': 'sick',
    'remote': 'remote',
    'on_leave': 'vacation',
    'inactive': 'active' // Show as active but filter out in query
  };
  
  return statusMap[dbStatus] || 'active';
}
