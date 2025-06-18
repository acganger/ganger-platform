import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Types for dashboard data
interface DashboardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    performance?: {
      queryTime: number;
      totalTime: number;
    };
  };
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
  location: string;
  avatar_url?: string;
}

interface DashboardData {
  preferences: any;
  widgets: any[];
  widgetData: Record<string, any>;
  announcements: any[];
  quickActions: any[];
  userInfo: UserInfo;
}

// Request validation schema
const DashboardRequestSchema = z.object({
  refresh: z.boolean().optional(),
  widgets: z.array(z.string()).optional()
});

// Utility functions
function successResponse<T>(data: T, meta?: any): DashboardApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...meta
    }
  };
}

function errorResponse(code: string, message: string, details?: any): DashboardApiResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// GET /api/dashboard - Get personalized dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const widgets = searchParams.get('widgets')?.split(',');
    
    const query = DashboardRequestSchema.parse({ refresh, widgets });
    const startTime = Date.now();

    // Mock user data for now - in real implementation, get from auth
    const user = {
      id: '1',
      name: 'Dr. Ganger',
      email: 'ganger@gangerdermatology.com',
      role: 'superadmin',
      locations: ['Main Clinic'],
      avatar_url: null
    };

    // Mock dashboard data
    const preferences = {
      layout_columns: 3,
      widget_arrangement: [],
      theme_preference: 'system'
    };

    const userWidgets = [
      { widget_id: 'application_launcher', position: 0, size: { width: 1, height: 1 } },
      { widget_id: 'system_health', position: 1, size: { width: 1, height: 1 } },
      { widget_id: 'quick_actions', position: 2, size: { width: 1, height: 1 } }
    ];

    const widgetData = {
      application_launcher: {
        applications: [
          { id: 'socials', name: 'Socials & Reviews', url: '/socials' },
          { id: 'staffing', name: 'Clinical Staffing', url: '/staffing' },
          { id: 'compliance', name: 'Compliance Training', url: '/compliance' }
        ],
        recentApps: [],
        totalApps: 3
      },
      system_health: {
        uptime: '99.9%',
        activeUsers: 42,
        apiRequests: 1200,
        responseTime: '125ms'
      },
      quick_actions: {
        actions: [
          { id: 'backup', name: 'Database Backup', action: 'backup_database' },
          { id: 'deploy', name: 'Deploy Updates', action: 'deploy_updates' },
          { id: 'monitor', name: 'System Monitor', action: 'system_monitor' }
        ],
        totalActions: 3
      }
    };

    const announcements: any[] = [];
    const quickActions = [
      { id: 'backup', display_name: 'Database Backup', action: 'backup_database' },
      { id: 'deploy', display_name: 'Deploy Updates', action: 'deploy_updates' }
    ];

    const queryTime = Date.now() - startTime;

    const dashboardData: DashboardData = {
      preferences,
      widgets: userWidgets,
      widgetData,
      announcements,
      quickActions,
      userInfo: {
        name: user.name || user?.email.split('@')[0],
        email: user?.email,
        role: user.role,
        location: user.locations?.[0] || 'Unknown',
        avatar_url: user.avatar_url || undefined
      }
    };

    return NextResponse.json(successResponse(dashboardData, {
      performance: {
        queryTime,
        totalTime: queryTime
      },
      widgets_count: userWidgets.length,
      announcements_count: announcements.length,
      quick_actions_count: quickActions.length
    }));

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid dashboard request', error.errors),
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        errorResponse('FETCH_FAILED', 'Failed to fetch dashboard data'),
        { status: 500 }
      );
    }
  }
}

// POST /api/dashboard - Update dashboard preferences
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences, widget_arrangement } = body;

    // Mock user data for now
    const user = {
      id: '1',
      name: 'Dr. Ganger',
      email: 'ganger@gangerdermatology.com',
      role: 'superadmin'
    };

    // Mock preference update
    const updatedPreferences = {
      ...preferences,
      widget_arrangement,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(successResponse({
      preferences: updatedPreferences,
      message: 'Dashboard preferences updated successfully'
    }));

  } catch (error) {
    return NextResponse.json(
      errorResponse('UPDATE_FAILED', 'Failed to update dashboard preferences'),
      { status: 500 }
    );
  }
}

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';