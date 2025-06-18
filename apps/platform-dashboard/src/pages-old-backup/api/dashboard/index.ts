// Platform Entrypoint Dashboard - Main Dashboard Data API
// Returns personalized dashboard configuration and widget data

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { db } from '@/lib/db';
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
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const query = DashboardRequestSchema.parse(req.query);
    const startTime = Date.now();

    // Get user preferences or create defaults
    let preferencesResult = await db.query(`
      SELECT * FROM user_dashboard_preferences 
      WHERE user_id = $1
    `, [user.id]);

    let preferences: any;
    if (preferencesResult.length === 0) {
      preferences = await createDefaultPreferences(user.id);
    } else {
      preferences = preferencesResult[0];
    }

    // Get available widgets for user
    const availableWidgets = await db.query(`
      SELECT * FROM dashboard_widgets 
      WHERE is_active = true
        AND (
          required_roles = ARRAY[]::TEXT[] 
          OR $1 = ANY(required_roles)
        )
      ORDER BY display_name ASC
    `, [user.role]);

    // Get user's widget arrangement or use defaults
    const userWidgets = preferences.widget_arrangement && preferences.widget_arrangement.length > 0
      ? preferences.widget_arrangement
      : getDefaultWidgetArrangement(availableWidgets, user.role);

    // Get widget data if not specifically requesting refresh
    const widgetData = await getWidgetData(userWidgets, user, query.refresh || false);

    // Get active announcements
    const announcements = await getActiveAnnouncements(user);

    // Get quick actions
    const quickActions = await db.query(`
      SELECT * FROM quick_actions 
      WHERE is_active = true
        AND (
          required_roles = ARRAY[]::TEXT[] 
          OR $1 = ANY(required_roles)
        )
      ORDER BY display_order ASC, display_name ASC
    `, [user.role]);

    // Log dashboard view
    await logUserActivity({
      user_id: user.id,
      activity_type: 'dashboard_view',
      session_id: Array.isArray(req.headers['x-session-id']) 
        ? req.headers['x-session-id'][0] 
        : req.headers['x-session-id'] || 'unknown'
    });

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
        avatar_url: user.avatar_url
      }
    };

    res.status(200).json(successResponse(dashboardData, {
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
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid dashboard request', error.errors));
    } else {
      res.status(500).json(errorResponse('FETCH_FAILED', 'Failed to fetch dashboard data'));
    }
  }
}

// POST /api/dashboard - Update dashboard preferences
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { preferences, widget_arrangement } = req.body;

    // Update user preferences
    const updatedPreferences = await db.query(`
      UPDATE user_dashboard_preferences 
      SET 
        layout_columns = COALESCE($2, layout_columns),
        widget_arrangement = COALESCE($3, widget_arrangement),
        theme_preference = COALESCE($4, theme_preference),
        show_weather = COALESCE($5, show_weather),
        show_team_activity = COALESCE($6, show_team_activity),
        show_recent_documents = COALESCE($7, show_recent_documents),
        show_upcoming_meetings = COALESCE($8, show_upcoming_meetings),
        desktop_notifications = COALESCE($9, desktop_notifications),
        notification_sound = COALESCE($10, notification_sound),
        quiet_hours_start = COALESCE($11, quiet_hours_start),
        quiet_hours_end = COALESCE($12, quiet_hours_end),
        pinned_applications = COALESCE($13, pinned_applications),
        custom_quick_actions = COALESCE($14, custom_quick_actions),
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `, [
      user.id,
      preferences?.layout_columns,
      widget_arrangement ? JSON.stringify(widget_arrangement) : null,
      preferences?.theme_preference,
      preferences?.show_weather,
      preferences?.show_team_activity,
      preferences?.show_recent_documents,
      preferences?.show_upcoming_meetings,
      preferences?.desktop_notifications,
      preferences?.notification_sound,
      preferences?.quiet_hours_start,
      preferences?.quiet_hours_end,
      preferences?.pinned_applications,
      preferences?.custom_quick_actions ? JSON.stringify(preferences.custom_quick_actions) : null
    ]);

    // Log preference update
    await logUserActivity({
      user_id: user.id,
      activity_type: 'dashboard_view',
      target_action: 'preferences_updated',
      metadata: { updated_fields: Object.keys(preferences || {}) }
    });

    res.status(200).json(successResponse({
      preferences: updatedPreferences[0],
      message: 'Dashboard preferences updated successfully'
    }));

  } catch (error) {
    res.status(500).json(errorResponse('UPDATE_FAILED', 'Failed to update dashboard preferences'));
  }
}

// Helper functions

async function createDefaultPreferences(userId: string) {
  const defaultPrefs = await db.query(`
    INSERT INTO user_dashboard_preferences (
      user_id, layout_columns, widget_arrangement, theme_preference
    ) VALUES ($1, 3, '[]'::jsonb, 'system')
    RETURNING *
  `, [userId]);

  return defaultPrefs[0];
}

async function getActiveAnnouncements(user: any) {
  const now = new Date().toISOString();
  
  return await db.query(`
    SELECT pa.* FROM platform_announcements pa
    LEFT JOIN user_announcement_dismissals uad 
      ON pa.id = uad.announcement_id AND uad.user_id = $1
    WHERE pa.is_active = true
      AND pa.display_start <= $2
      AND (pa.display_end IS NULL OR pa.display_end >= $2)
      AND (
        pa.target_roles = ARRAY[]::TEXT[] 
        OR $3 = ANY(pa.target_roles)
        OR $1 = ANY(pa.target_specific_users)
      )
      AND uad.id IS NULL
    ORDER BY pa.priority DESC, pa.created_at DESC
    LIMIT 10
  `, [user.id, now, user.role]);
}

function getDefaultWidgetArrangement(widgets: any[], userRole: string) {
  // Define role-based default arrangements
  const defaultArrangements: Record<string, string[]> = {
    staff: [
      'application_launcher',
      'notifications_center', 
      'quick_actions',
      'upcoming_meetings',
      'help_center'
    ],
    manager: [
      'application_launcher',
      'team_activity',
      'pending_approvals',
      'notifications_center',
      'quick_actions',
      'upcoming_meetings'
    ],
    superadmin: [
      'application_launcher',
      'team_activity',
      'pending_approvals',
      'notifications_center',
      'quick_actions',
      'system_health'
    ]
  };

  const arrangement = defaultArrangements[userRole] || defaultArrangements.staff;
  
  return arrangement.map((widgetId, index) => {
    const widget = widgets.find((w: any) => w.widget_id === widgetId);
    return widget ? {
      widget_id: widgetId,
      position: index,
      size: { width: 1, height: 1 }
    } : null;
  }).filter(Boolean);
}

async function getWidgetData(widgets: any[], user: any, forceRefresh: boolean = false) {
  const widgetData: Record<string, any> = {};

  for (const widget of widgets) {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = await getCachedWidgetData(widget.widget_id, user.id);
        if (cached) {
          widgetData[widget.widget_id] = cached.data_content;
          continue;
        }
      }

      // Generate fresh data
      const data = await generateWidgetData(widget.widget_id, user);
      
      // Cache the data
      await cacheWidgetData(widget.widget_id, user.id, data);
      
      widgetData[widget.widget_id] = data;
    } catch (error) {
      widgetData[widget.widget_id] = { error: 'Failed to load data' };
    }
  }

  return widgetData;
}

async function getCachedWidgetData(widgetId: string, userId: string): Promise<{ data_content: any; expires_at: string } | null> {
  const cached = await db.query(`
    SELECT data_content, expires_at FROM widget_data_cache 
    WHERE widget_id = $1 AND user_id = $2 AND expires_at > NOW()
  `, [widgetId, userId]);

  if (cached.length > 0) {
    // Update access time
    await db.query(`
      UPDATE widget_data_cache 
      SET last_accessed = NOW(), cache_hits = cache_hits + 1
      WHERE widget_id = $1 AND user_id = $2
    `, [widgetId, userId]);

    return cached[0] as unknown as { data_content: any; expires_at: string };
  }
  return null;
}

async function cacheWidgetData(widgetId: string, userId: string, data: any) {
  const expiresAt = new Date(Date.now() + getWidgetCacheTTL(widgetId) * 1000);

  await db.query(`
    INSERT INTO widget_data_cache (widget_id, user_id, data_content, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (widget_id, user_id) 
    DO UPDATE SET 
      data_content = EXCLUDED.data_content,
      expires_at = EXCLUDED.expires_at,
      cached_at = NOW()
  `, [widgetId, userId, JSON.stringify(data), expiresAt.toISOString()]);
}

function getWidgetCacheTTL(widgetId: string): number {
  // Define cache TTL per widget type (in seconds)
  const cacheTTLs: Record<string, number> = {
    application_launcher: 3600, // 1 hour
    notifications_center: 60,   // 1 minute
    team_activity: 300,         // 5 minutes
    pending_approvals: 300,     // 5 minutes
    upcoming_meetings: 900,     // 15 minutes
    recent_documents: 600,      // 10 minutes
    quick_actions: 3600,        // 1 hour
    help_center: 7200          // 2 hours
  };

  return cacheTTLs[widgetId] || 300; // Default 5 minutes
}

async function generateWidgetData(widgetId: string, user: any): Promise<any> {
  switch (widgetId) {
    case 'application_launcher':
      return await getApplicationLauncherData(user);
    
    case 'notifications_center':
      return await getNotificationCenterData(user);
    
    case 'team_activity':
      return await getTeamActivityData(user);
    
    case 'pending_approvals':
      return await getPendingApprovalsData(user);
    
    case 'upcoming_meetings':
      return await getUpcomingMeetingsData(user);
    
    case 'recent_documents':
      return await getRecentDocumentsData(user);
    
    case 'quick_actions':
      return await getQuickActionsData(user);
    
    case 'help_center':
      return await getHelpCenterData(user);
    
    default:
      return { message: 'Widget not implemented' };
  }
}

async function getApplicationLauncherData(user: any) {
  // Get applications accessible to user
  const applications = await db.query(`
    SELECT * FROM platform_applications 
    WHERE is_active = true
      AND (
        required_roles = ARRAY[]::TEXT[] 
        OR $1 = ANY(required_roles)
      )
    ORDER BY display_name ASC
  `, [user.role]);

  // Get user's recent app launches
  const recentLaunches = await db.query(`
    SELECT target_app, COUNT(*) as launch_count, MAX(created_at) as last_launched
    FROM user_activity_log 
    WHERE user_id = $1 
      AND activity_type = 'app_launch'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY target_app
    ORDER BY launch_count DESC, last_launched DESC
    LIMIT 6
  `, [user.id]);

  return {
    applications,
    recentApps: recentLaunches,
    totalApps: applications.length
  };
}

async function getNotificationCenterData(user: any) {
  // For now, return mock data structure
  // This would integrate with actual notification system
  return {
    notifications: [],
    unreadCount: 0,
    totalCount: 0
  };
}

async function getTeamActivityData(user: any) {
  // Get recent team activities in the same location
  const activities = await db.query(`
    SELECT 
      ual.*,
      u.name as user_name,
      u.email as user_email,
      u.avatar_url
    FROM user_activity_log ual
    JOIN users u ON ual.user_id = u.id
    WHERE u.primary_location = $2
      AND ual.created_at >= NOW() - INTERVAL '24 hours'
      AND ual.user_id != $1
    ORDER BY ual.created_at DESC
    LIMIT 10
  `, [user.id, user.locations?.[0] || 'unknown']);

  return {
    activities,
    activeToday: activities.length
  };
}

async function getPendingApprovalsData(user: any) {
  // Mock structure for pending approvals
  // This would integrate with various approval systems
  return {
    approvals: [],
    totalPending: 0,
    urgentCount: 0
  };
}

async function getUpcomingMeetingsData(user: any) {
  // Mock structure for Google Calendar integration
  return {
    meetings: [],
    totalMeetings: 0
  };
}

async function getRecentDocumentsData(user: any) {
  // Mock structure for Google Drive integration
  return {
    documents: [],
    totalDocuments: 0
  };
}

async function getQuickActionsData(user: any) {
  const quickActions = await db.query(`
    SELECT * FROM quick_actions 
    WHERE is_active = true
      AND (
        required_roles = ARRAY[]::TEXT[] 
        OR $1 = ANY(required_roles)
      )
    ORDER BY display_order ASC, display_name ASC
    LIMIT 8
  `, [user.role]);

  return {
    actions: quickActions,
    totalActions: quickActions.length
  };
}

async function getHelpCenterData(user: any) {
  // Mock structure for help center
  return {
    popularArticles: [],
    recentArticles: [],
    totalArticles: 0
  };
}

async function logUserActivity(activity: {
  user_id: string;
  activity_type: string;
  target_app?: string;
  target_widget?: string;
  target_action?: string;
  session_id?: string;
  metadata?: any;
}) {
  try {
    await db.query(`
      INSERT INTO user_activity_log (
        user_id, activity_type, target_app, target_widget, 
        target_action, session_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      activity.user_id,
      activity.activity_type,
      activity.target_app,
      activity.target_widget,
      activity.target_action,
      activity.session_id,
      activity.metadata ? JSON.stringify(activity.metadata) : null
    ]);
  } catch (error) {
  }
}

// Main handler with authentication
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const user = req.user; // Added by withAuth middleware
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, user);
        break;
      case 'POST':
        await handlePost(req, res, user);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
  }
};

// Duplicate function removed - using the simpler version above

export default withAuth(handler, {
  roles: ['staff', 'manager', 'superadmin']
});