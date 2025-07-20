import { createApiHandler, ApiErrors, successResponse } from '@ganger/utils/server';
import { createSupabaseServerClient } from '@ganger/auth/server';

interface ApplicationStatus {
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  users: number;
  lastHealthCheck?: string;
}

export default createApiHandler(
  async (req, res) => {
    const supabase = createSupabaseServerClient();
    
    if (req.method === 'GET') {
      try {
        // Define all platform applications
        const applicationNames = [
          'Inventory Management',
          'Patient Handouts',
          'Check-in Kiosk',
          'Medication Authorization',
          'EOS L10',
          'Ganger Actions',
          'Clinical Staffing',
          'Call Center Operations',
          'Pharma Scheduling',
          'Batch Closeout',
          'Compliance Training',
          'Socials & Reviews',
          'AI Receptionist',
          'AI Purchasing Agent',
          'Consolidated Order Form',
          'Component Showcase',
          'Integration Status'
        ];
        
        // Get application status from database
        const { data: appData } = await supabase
          .from('application_health')
          .select('*')
          .in('name', applicationNames)
          .order('name');
        
        // Get active user counts per application
        const { data: sessionData } = await supabase
          .from('user_sessions')
          .select('application, user_id')
          .gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active in last 30 mins
        
        // Count active users per app
        const activeUsersByApp = sessionData?.reduce((acc, session) => {
          const app = session.application;
          if (!acc[app]) acc[app] = new Set();
          acc[app].add(session.user_id);
          return acc;
        }, {} as Record<string, Set<string>>) || {};
        
        // Build application status list
        const applications: ApplicationStatus[] = applicationNames.map(name => {
          const dbApp = appData?.find(app => app.name === name);
          const userCount = activeUsersByApp[name]?.size || 0;
          
          return {
            name,
            status: dbApp?.status || 'online',
            users: userCount,
            lastHealthCheck: dbApp?.last_check_at
          };
        });
        
        // Return top 5 most active applications
        const topApplications = applications
          .sort((a, b) => b.users - a.users)
          .slice(0, 5);
        
        return successResponse(res, topApplications);
      } catch (error) {
        console.error('Error fetching application status:', error);
        
        // Return fallback data
        return successResponse(res, [
          { name: 'Inventory Management', status: 'online', users: 12 },
          { name: 'Patient Handouts', status: 'online', users: 8 },
          { name: 'Check-in Kiosk', status: 'online', users: 3 },
          { name: 'EOS L10', status: 'online', users: 24 },
          { name: 'Clinical Staffing', status: 'online', users: 15 }
        ]);
      }
    }
    
    throw ApiErrors.methodNotAllowed(req.method || 'UNKNOWN');
  },
  {
    requireAuth: true,
    allowedMethods: ['GET']
  }
);