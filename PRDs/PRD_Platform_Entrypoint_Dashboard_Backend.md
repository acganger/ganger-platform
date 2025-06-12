# Platform Entrypoint Dashboard - Backend Development PRD
*Server-side API and Database Implementation for Ganger Platform*

## 📋 Document Information
- **Application Name**: Platform Entrypoint Dashboard (Backend)
- **Terminal Assignment**: TERMINAL 2 - BACKEND
- **Priority**: High
- **Development Timeline**: 3-4 weeks
- **Dependencies**: @ganger/db, @ganger/auth/server, @ganger/integrations/server, @ganger/utils/server
- **Integration Requirements**: All platform applications, Google Workspace, Analytics processing

---

## 🎯 Backend Scope

### **Terminal 2 Responsibilities**
- Database schema and migrations for dashboard data
- API route implementations for dashboard functionality
- Widget data aggregation from all applications
- User preference and customization management
- Analytics and usage tracking
- Real-time notification and presence systems
- Search indexing and query processing

### **Excluded from Backend Terminal**
- React components and UI (Terminal 1)
- Client-side state management (Terminal 1)
- Frontend drag & drop logic (Terminal 1)
- Dashboard layout rendering (Terminal 1)

---

## 🏗️ Backend Technology Stack

### **Required Server-Side Packages**
```typescript
// Server-only imports
import { withAuth, getUserFromToken, verifyPermissions } from '@ganger/auth/server';
import { db, DatabaseService } from '@ganger/db';
import { 
  GoogleWorkspaceClient, NotificationService, AnalyticsEngine,
  ServerCommunicationService, ServerCacheService 
} from '@ganger/integrations/server';
import { auditLog, validateDashboardData } from '@ganger/utils/server';
import type { 
  User, Application, DashboardWidget, UserPreferences,
  QuickAction, PlatformAnnouncement, UserActivity
} from '@ganger/types';
```

### **Backend-Specific Technology**
- **Widget Data Aggregation**: Cross-application data collection
- **Search Engine**: Full-text search across applications and help content
- **Analytics Processing**: User behavior analysis and insights
- **Real-time Systems**: WebSocket connections for live updates
- **Caching Layer**: Redis for dashboard performance optimization
- **Background Jobs**: Data aggregation and maintenance tasks

---

## 🗄️ Database Implementation

### **Migration Files**
```sql
-- Migration: 2025_01_11_create_dashboard_platform_tables.sql

-- User dashboard customization
CREATE TABLE user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Layout preferences
  layout_columns INTEGER DEFAULT 3 CHECK (layout_columns BETWEEN 1 AND 4),
  widget_arrangement JSONB DEFAULT '[]'::jsonb, -- [{widget_id, position, size}]
  theme_preference VARCHAR(20) DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  
  -- Content preferences
  show_weather BOOLEAN DEFAULT true,
  show_team_activity BOOLEAN DEFAULT true,
  show_recent_documents BOOLEAN DEFAULT true,
  show_upcoming_meetings BOOLEAN DEFAULT true,
  
  -- Notification preferences
  desktop_notifications BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '18:00',
  quiet_hours_end TIME DEFAULT '08:00',
  
  -- Quick actions
  pinned_applications TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_quick_actions JSONB DEFAULT '[]'::jsonb,
  
  UNIQUE(user_id)
);

-- Dashboard widgets registry
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Widget identification
  widget_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Widget metadata
  category VARCHAR(50) NOT NULL CHECK (category IN ('application', 'information', 'action', 'communication')),
  icon_url TEXT,
  
  -- Widget behavior
  supports_resize BOOLEAN DEFAULT true,
  min_width INTEGER DEFAULT 1,
  min_height INTEGER DEFAULT 1,
  max_width INTEGER DEFAULT 4,
  max_height INTEGER DEFAULT 4,
  
  -- Widget content source
  source_application VARCHAR(100) REFERENCES platform_applications(app_name),
  data_endpoint TEXT, -- API endpoint for widget data
  refresh_interval_seconds INTEGER DEFAULT 300, -- 5 minutes default
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Widget availability
  is_active BOOLEAN DEFAULT true,
  is_system_widget BOOLEAN DEFAULT false, -- Cannot be removed by users
  
  CONSTRAINT valid_category CHECK (category IN ('application', 'information', 'action', 'communication'))
);

-- User activity tracking for intelligent suggestions
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('app_launch', 'widget_interaction', 'quick_action', 'dashboard_view')),
  target_app VARCHAR(100),
  target_widget VARCHAR(100),
  target_action VARCHAR(100),
  
  -- Context
  session_id VARCHAR(100),
  time_spent_seconds INTEGER,
  interaction_count INTEGER DEFAULT 1,
  
  -- Analytics metadata
  user_agent TEXT,
  ip_address INET,
  location_context VARCHAR(100),
  
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('app_launch', 'widget_interaction', 'quick_action', 'dashboard_view'))
);

-- Platform notifications and announcements
CREATE TABLE platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Announcement content
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'urgent', 'maintenance')),
  
  -- Display settings
  priority INTEGER DEFAULT 0, -- Higher numbers show first
  banner_color VARCHAR(20) DEFAULT 'blue',
  show_icon BOOLEAN DEFAULT true,
  
  -- Targeting
  target_roles TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all users
  target_locations TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all locations
  target_specific_users UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Scheduling
  display_start TIMESTAMPTZ DEFAULT NOW(),
  display_end TIMESTAMPTZ,
  auto_dismiss_hours INTEGER DEFAULT 24,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_announcement_type CHECK (announcement_type IN ('info', 'warning', 'urgent', 'maintenance'))
);

-- User announcement dismissals
CREATE TABLE user_announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES platform_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, announcement_id)
);

-- Quick actions registry
CREATE TABLE quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Action identification
  action_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Action appearance
  icon_name VARCHAR(100) NOT NULL, -- Lucide icon name
  button_color VARCHAR(20) DEFAULT 'blue',
  
  -- Action behavior
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('app_launch', 'external_link', 'modal_form', 'api_call')),
  action_target TEXT NOT NULL, -- URL, app name, or form ID
  opens_in_new_tab BOOLEAN DEFAULT false,
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Categorization
  category VARCHAR(100) DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_system_action BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_action_type CHECK (action_type IN ('app_launch', 'external_link', 'modal_form', 'api_call'))
);

-- Dashboard metrics for analytics
CREATE TABLE dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metric identification
  metric_type VARCHAR(100) NOT NULL, -- 'daily_active_users', 'app_launches', 'widget_interactions'
  metric_date DATE NOT NULL,
  
  -- Metric value
  metric_value NUMERIC NOT NULL,
  metric_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Dimensions
  user_role VARCHAR(100),
  location_name VARCHAR(100),
  application_name VARCHAR(100),
  
  UNIQUE(metric_type, metric_date, user_role, location_name, application_name)
);

-- Application health monitoring
CREATE TABLE application_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_name VARCHAR(100) NOT NULL,
  health_check_url TEXT,
  
  -- Status tracking
  current_status VARCHAR(20) DEFAULT 'unknown' CHECK (current_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  error_message TEXT,
  
  -- Historical data
  uptime_percentage DECIMAL(5,2),
  avg_response_time_24h DECIMAL(8,2),
  incidents_count_7d INTEGER DEFAULT 0,
  
  -- Alert configuration
  alert_threshold_ms INTEGER DEFAULT 5000,
  alert_enabled BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(application_name)
);

-- Search index for global search
CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document identification
  content_type VARCHAR(50) NOT NULL, -- 'application', 'help_article', 'user', 'document'
  content_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Search metadata
  keywords TEXT[],
  categories TEXT[],
  search_vector TSVECTOR,
  
  -- Access control
  required_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Content metadata
  url TEXT,
  icon_url TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(content_type, content_id)
);

-- Widget data cache
CREATE TABLE widget_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Cached data
  data_content JSONB NOT NULL,
  data_hash VARCHAR(64), -- For change detection
  
  -- Cache metadata
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance tracking
  generation_time_ms INTEGER,
  cache_hits INTEGER DEFAULT 0,
  
  UNIQUE(widget_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_user_preferences_user ON user_dashboard_preferences(user_id);
CREATE INDEX idx_widgets_category ON dashboard_widgets(category, is_active);
CREATE INDEX idx_user_activity_user_time ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_announcements_active ON platform_announcements(is_active, display_start, display_end);
CREATE INDEX idx_quick_actions_role ON quick_actions USING GIN(required_roles);
CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(metric_date DESC, metric_type);
CREATE INDEX idx_app_health_status ON application_health_status(current_status, last_check_at);
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_content_type ON search_index(content_type, last_modified DESC);
CREATE INDEX idx_widget_cache_expiry ON widget_data_cache(expires_at);
CREATE INDEX idx_widget_cache_user_widget ON widget_data_cache(user_id, widget_id);

-- Row Level Security
ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_data_cache ENABLE ROW LEVEL SECURITY;

-- Access policies
CREATE POLICY "Users can manage own preferences" ON user_dashboard_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view widgets they have access to" ON dashboard_widgets
  FOR SELECT USING (
    CASE 
      WHEN required_roles = ARRAY[]::TEXT[] THEN true
      ELSE auth.jwt() ->> 'role' = ANY(required_roles)
    END
  );

CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (
    user_id = auth.uid() 
    OR auth.jwt() ->> 'role' IN ('manager', 'superadmin')
  );

CREATE POLICY "Users can insert own activity" ON user_activity_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view announcements targeted to them" ON platform_announcements
  FOR SELECT USING (
    is_active = true
    AND (display_start IS NULL OR display_start <= NOW())
    AND (display_end IS NULL OR display_end >= NOW())
    AND (
      target_roles = ARRAY[]::TEXT[] 
      OR auth.jwt() ->> 'role' = ANY(target_roles)
      OR auth.uid() = ANY(target_specific_users)
    )
  );

CREATE POLICY "Users can manage own dismissals" ON user_announcement_dismissals
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view quick actions they have access to" ON quick_actions
  FOR SELECT USING (
    is_active = true
    AND (
      required_roles = ARRAY[]::TEXT[] 
      OR auth.jwt() ->> 'role' = ANY(required_roles)
    )
  );

CREATE POLICY "Managers can view metrics" ON dashboard_metrics
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('manager', 'superadmin'));

CREATE POLICY "Users can view app health" ON application_health_status
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('staff', 'manager', 'superadmin'));

CREATE POLICY "Users can search accessible content" ON search_index
  FOR SELECT USING (
    CASE 
      WHEN required_roles = ARRAY[]::TEXT[] THEN true
      ELSE auth.jwt() ->> 'role' = ANY(required_roles)
    END
  );

CREATE POLICY "Users can access own widget cache" ON widget_data_cache
  FOR ALL USING (user_id = auth.uid());

-- Create full-text search trigger
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(array_to_string(NEW.keywords, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER search_vector_update
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Insert default widgets
INSERT INTO dashboard_widgets (widget_id, display_name, description, category, is_system_widget, required_roles) VALUES
('application_launcher', 'Application Launcher', 'Launch any platform application', 'application', true, ARRAY['staff', 'manager', 'superadmin']),
('notifications_center', 'Notifications', 'View and manage notifications', 'communication', true, ARRAY['staff', 'manager', 'superadmin']),
('quick_actions', 'Quick Actions', 'Frequently used actions and shortcuts', 'action', false, ARRAY['staff', 'manager', 'superadmin']),
('upcoming_meetings', 'Upcoming Meetings', 'Google Calendar integration', 'information', false, ARRAY['staff', 'manager', 'superadmin']),
('recent_documents', 'Recent Documents', 'Google Drive recent files', 'information', false, ARRAY['staff', 'manager', 'superadmin']),
('team_activity', 'Team Activity', 'Recent team member activities', 'communication', false, ARRAY['manager', 'superadmin']),
('pending_approvals', 'Pending Approvals', 'Items requiring approval', 'action', false, ARRAY['manager', 'superadmin']),
('help_center', 'Help & Support', 'Access help and support resources', 'information', true, ARRAY['staff', 'manager', 'superadmin']);

-- Insert default quick actions
INSERT INTO quick_actions (action_id, display_name, description, icon_name, action_type, action_target, required_roles) VALUES
('new_support_ticket', 'New Support Ticket', 'Create a new IT support ticket', 'plus', 'app_launch', 'staff', ARRAY['staff', 'manager', 'superadmin']),
('request_time_off', 'Request Time Off', 'Submit a time off request', 'calendar', 'app_launch', 'staff', ARRAY['staff', 'manager', 'superadmin']),
('access_help_center', 'Help Center', 'Access help articles and guides', 'help-circle', 'app_launch', 'help', ARRAY['staff', 'manager', 'superadmin']),
('system_status', 'System Status', 'View platform health status', 'activity', 'modal_form', 'system_status', ARRAY['manager', 'superadmin']);
```

---

## 🔌 API Route Implementation

### **Dashboard Data APIs**
```typescript
// pages/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@ganger/auth/server';
import { db } from '@ganger/db';
import { DashboardAggregator } from '@ganger/integrations/server';

export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    // Get user preferences
    const preferences = await db.user_dashboard_preferences.findUnique({
      where: { user_id: user.id }
    }) || await createDefaultPreferences(user.id);

    // Get available widgets for user
    const availableWidgets = await db.dashboard_widgets.findMany({
      where: {
        is_active: true,
        OR: [
          { required_roles: { isEmpty: true } },
          { required_roles: { has: user.role } }
        ]
      },
      orderBy: { display_name: 'asc' }
    });

    // Get user's widget arrangement
    const userWidgets = preferences.widget_arrangement || 
      getDefaultWidgetArrangement(availableWidgets, user.role);

    // Aggregate widget data
    const dashboardAggregator = new DashboardAggregator();
    const widgetData = await dashboardAggregator.aggregateWidgetData(
      userWidgets, 
      user
    );

    // Get active announcements
    const announcements = await getActiveAnnouncements(user);

    // Get quick actions
    const quickActions = await db.quick_actions.findMany({
      where: {
        is_active: true,
        OR: [
          { required_roles: { isEmpty: true } },
          { required_roles: { has: user.role } }
        ]
      },
      orderBy: { display_order: 'asc' }
    });

    // Log dashboard view
    await logUserActivity({
      user_id: user.id,
      activity_type: 'dashboard_view',
      session_id: request.headers.get('x-session-id')
    });

    return NextResponse.json({
      success: true,
      data: {
        preferences,
        widgets: userWidgets,
        widgetData,
        announcements,
        quickActions,
        userInfo: {
          name: user.name,
          email: user.email,
          role: user.role,
          location: user.primary_location
        }
      }
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

async function createDefaultPreferences(userId: string) {
  return await db.user_dashboard_preferences.create({
    data: {
      user_id: userId,
      layout_columns: 3,
      widget_arrangement: [],
      theme_preference: 'system'
    }
  });
}

async function getActiveAnnouncements(user: User) {
  const now = new Date();
  
  return await db.platform_announcements.findMany({
    where: {
      is_active: true,
      display_start: { lte: now },
      OR: [
        { display_end: null },
        { display_end: { gte: now } }
      ],
      AND: [
        {
          OR: [
            { target_roles: { isEmpty: true } },
            { target_roles: { has: user.role } },
            { target_specific_users: { has: user.id } }
          ]
        },
        {
          NOT: {
            user_announcement_dismissals: {
              some: { user_id: user.id }
            }
          }
        }
      ]
    },
    orderBy: [
      { priority: 'desc' },
      { created_at: 'desc' }
    ]
  });
}

function getDefaultWidgetArrangement(widgets: any[], userRole: string) {
  // Define role-based default arrangements
  const defaultArrangements = {
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
    const widget = widgets.find(w => w.widget_id === widgetId);
    return widget ? {
      widget_id: widgetId,
      position: index,
      size: { width: 1, height: 1 }
    } : null;
  }).filter(Boolean);
}
```

### **Widget Data Aggregation Service**
```typescript
// packages/integrations/server/dashboard-aggregator.ts
export class DashboardAggregator {
  private cache: ServerCacheService;

  constructor() {
    this.cache = new ServerCacheService();
  }

  async aggregateWidgetData(widgets: any[], user: User): Promise<Record<string, any>> {
    const widgetData = {};

    for (const widget of widgets) {
      try {
        const cacheKey = `widget:${widget.widget_id}:${user.id}`;
        
        // Check cache first
        let data = await this.cache.get(cacheKey);
        
        if (!data) {
          // Generate fresh data
          data = await this.generateWidgetData(widget.widget_id, user);
          
          // Cache with appropriate TTL
          const ttl = this.getWidgetCacheTTL(widget.widget_id);
          await this.cache.set(cacheKey, data, ttl);
        }
        
        widgetData[widget.widget_id] = data;
      } catch (error) {
        console.error(`Widget data aggregation failed for ${widget.widget_id}:`, error);
        widgetData[widget.widget_id] = { error: 'Failed to load data' };
      }
    }

    return widgetData;
  }

  private async generateWidgetData(widgetId: string, user: User): Promise<any> {
    switch (widgetId) {
      case 'application_launcher':
        return await this.getApplicationLauncherData(user);
      
      case 'notifications_center':
        return await this.getNotificationCenterData(user);
      
      case 'team_activity':
        return await this.getTeamActivityData(user);
      
      case 'pending_approvals':
        return await this.getPendingApprovalsData(user);
      
      case 'upcoming_meetings':
        return await this.getUpcomingMeetingsData(user);
      
      case 'recent_documents':
        return await this.getRecentDocumentsData(user);
      
      case 'quick_actions':
        return await this.getQuickActionsData(user);
      
      case 'help_center':
        return await this.getHelpCenterData(user);
      
      default:
        return { message: 'Widget not implemented' };
    }
  }

  private async getApplicationLauncherData(user: User) {
    // Get applications accessible to user
    const applications = await db.platform_applications.findMany({
      where: {
        is_active: true,
        OR: [
          { required_roles: { isEmpty: true } },
          { required_roles: { has: user.role } }
        ]
      }
    });

    // Get user's recent app launches
    const recentLaunches = await db.user_activity_log.findMany({
      where: {
        user_id: user.id,
        activity_type: 'app_launch',
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Calculate app usage frequency
    const appUsage = recentLaunches.reduce((acc, launch) => {
      acc[launch.target_app] = (acc[launch.target_app] || 0) + 1;
      return acc;
    }, {});

    // Sort apps by usage frequency
    const sortedApps = applications.sort((a, b) => {
      const usageA = appUsage[a.app_name] || 0;
      const usageB = appUsage[b.app_name] || 0;
      return usageB - usageA;
    });

    return {
      applications: sortedApps,
      recentApps: sortedApps.slice(0, 6),
      totalApps: applications.length
    };
  }

  private async getNotificationCenterData(user: User) {
    const notifications = await db.notifications.findMany({
      where: {
        user_id: user.id,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { created_at: 'desc' },
      take: 20
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return {
      notifications: notifications.slice(0, 5), // Show only recent 5
      unreadCount,
      totalCount: notifications.length
    };
  }

  private async getTeamActivityData(user: User) {
    // Get team members in same location
    const teamMembers = await db.users.findMany({
      where: {
        primary_location: user.primary_location,
        is_active: true
      }
    });

    const teamMemberIds = teamMembers.map(tm => tm.id);

    // Get recent team activities
    const activities = await db.user_activity_log.findMany({
      where: {
        user_id: { in: teamMemberIds },
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: { name: true, email: true, avatar_url: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    return {
      activities,
      teamMemberCount: teamMembers.length,
      activeToday: activities.filter(a => 
        a.created_at >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length
    };
  }

  private async getUpcomingMeetingsData(user: User) {
    try {
      // Integrate with Google Calendar
      const googleClient = new GoogleWorkspaceClient();
      const meetings = await googleClient.getUpcomingMeetings(user.email, {
        maxResults: 5,
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24 hours
      });

      return {
        meetings: meetings.map(meeting => ({
          id: meeting.id,
          title: meeting.summary,
          start: meeting.start.dateTime || meeting.start.date,
          end: meeting.end.dateTime || meeting.end.date,
          attendees: meeting.attendees?.length || 0,
          location: meeting.location,
          meetingUrl: meeting.hangoutLink || meeting.conferenceData?.entryPoints?.[0]?.uri
        })),
        totalMeetings: meetings.length
      };
    } catch (error) {
      console.error('Failed to fetch Google Calendar data:', error);
      return { meetings: [], error: 'Failed to connect to calendar' };
    }
  }

  private async getPendingApprovalsData(user: User) {
    // This would integrate with various approval systems
    // For now, we'll return mock data structure
    const approvals = [];

    // Check staff portal for pending approvals
    try {
      const staffApprovals = await this.getStaffPortalApprovals(user);
      approvals.push(...staffApprovals);
    } catch (error) {
      console.error('Failed to fetch staff approvals:', error);
    }

    // Check other systems for approvals
    // ...

    return {
      approvals: approvals.slice(0, 10),
      totalPending: approvals.length,
      urgentCount: approvals.filter(a => a.priority === 'urgent').length
    };
  }

  private getWidgetCacheTTL(widgetId: string): number {
    // Define cache TTL per widget type (in seconds)
    const cacheTTLs = {
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
}
```

### **Search API Implementation**
```typescript
// pages/api/search/route.ts
export const GET = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: { applications: [], help: [], users: [], documents: [] }
      });
    }

    // Perform full-text search
    const searchResults = await db.search_index.findMany({
      where: {
        AND: [
          {
            search_vector: {
              matches: query.split(' ').join(' & ')
            }
          },
          {
            OR: [
              { required_roles: { isEmpty: true } },
              { required_roles: { has: user.role } }
            ]
          }
        ]
      },
      orderBy: {
        _relevance: {
          fields: ['search_vector'],
          search: query,
          sort: 'desc'
        }
      },
      take: limit * 4 // Get more results to categorize
    });

    // Categorize results
    const categorizedResults = {
      applications: [],
      help: [],
      users: [],
      documents: []
    };

    searchResults.forEach(result => {
      const category = result.content_type === 'application' ? 'applications' :
                      result.content_type === 'help_article' ? 'help' :
                      result.content_type === 'user' ? 'users' : 'documents';
      
      if (categorizedResults[category].length < limit) {
        categorizedResults[category].push({
          id: result.content_id,
          title: result.title,
          excerpt: result.excerpt,
          url: result.url,
          icon_url: result.icon_url,
          type: result.content_type
        });
      }
    });

    // Log search activity
    await logUserActivity({
      user_id: user.id,
      activity_type: 'search',
      target_action: 'global_search',
      metadata: { query, results_count: searchResults.length }
    });

    return NextResponse.json({
      success: true,
      results: categorizedResults,
      totalResults: searchResults.length
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

// Search index maintenance
export async function updateSearchIndex() {
  try {
    // Index platform applications
    const applications = await db.platform_applications.findMany({
      where: { is_active: true }
    });

    for (const app of applications) {
      await db.search_index.upsert({
        where: {
          content_type_content_id: {
            content_type: 'application',
            content_id: app.app_name
          }
        },
        update: {
          title: app.display_name,
          content: `${app.display_name} ${app.description || ''}`,
          excerpt: app.description,
          url: app.app_url,
          icon_url: app.icon_url,
          keywords: [app.app_name, app.display_name],
          categories: [app.category],
          required_roles: app.required_roles,
          last_modified: app.updated_at
        },
        create: {
          content_type: 'application',
          content_id: app.app_name,
          title: app.display_name,
          content: `${app.display_name} ${app.description || ''}`,
          excerpt: app.description,
          url: app.app_url,
          icon_url: app.icon_url,
          keywords: [app.app_name, app.display_name],
          categories: [app.category],
          required_roles: app.required_roles
        }
      });
    }

    // Index help articles (this would come from a help system)
    // Index users (if enabled)
    // Index documents (if integrated)

    console.log('Search index updated successfully');
  } catch (error) {
    console.error('Search index update failed:', error);
  }
}
```

### **Quick Actions API**
```typescript
// pages/api/quick-actions/execute/route.ts
export const POST = withAuth(async (request: NextRequest, user: User) => {
  try {
    const { actionId, parameters } = await request.json();

    // Get quick action
    const action = await db.quick_actions.findUnique({
      where: { action_id: actionId }
    });

    if (!action) {
      return NextResponse.json(
        { error: 'Quick action not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    if (action.required_roles.length > 0 && !action.required_roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Execute action based on type
    let result;
    
    switch (action.action_type) {
      case 'app_launch':
        result = await executeAppLaunchAction(action, user, parameters);
        break;
      
      case 'external_link':
        result = { url: action.action_target, openInNewTab: action.opens_in_new_tab };
        break;
      
      case 'api_call':
        result = await executeAPICallAction(action, user, parameters);
        break;
      
      case 'modal_form':
        result = await executeModalFormAction(action, user, parameters);
        break;
      
      default:
        throw new Error(`Unsupported action type: ${action.action_type}`);
    }

    // Log action execution
    await logUserActivity({
      user_id: user.id,
      activity_type: 'quick_action',
      target_action: actionId,
      metadata: { parameters, result_type: action.action_type }
    });

    return NextResponse.json({
      success: true,
      result,
      action_type: action.action_type
    });
  } catch (error) {
    console.error('Quick action execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}, { requiredRoles: ['staff', 'manager', 'superadmin'] });

async function executeAppLaunchAction(action: QuickAction, user: User, parameters: any) {
  // Track app launch
  await logUserActivity({
    user_id: user.id,
    activity_type: 'app_launch',
    target_app: action.action_target,
    session_id: parameters?.session_id
  });

  // Get application URL
  const app = await db.platform_applications.findFirst({
    where: { app_name: action.action_target }
  });

  return {
    url: app?.app_url || `/${action.action_target}`,
    openInNewTab: action.opens_in_new_tab
  };
}

async function executeAPICallAction(action: QuickAction, user: User, parameters: any) {
  // Execute API call based on action target
  // This would be customized based on specific API integrations
  
  try {
    const response = await fetch(action.action_target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${generateServiceToken(user)}`
      },
      body: JSON.stringify({ user_id: user.id, ...parameters })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call action failed:', error);
    throw new Error('Failed to execute API action');
  }
}
```

---

## 🔄 Background Processing

### **Analytics and Maintenance Jobs**
```typescript
// packages/integrations/server/dashboard-background-jobs.ts
import { CronJob } from 'cron';

export class DashboardBackgroundJobs {
  private analyticsEngine: AnalyticsEngine;

  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
  }

  startJobs(): void {
    // Update search index every hour
    new CronJob('0 0 * * * *', async () => {
      try {
        console.log('Updating search index...');
        await updateSearchIndex();
        console.log('Search index updated successfully');
      } catch (error) {
        console.error('Search index update failed:', error);
      }
    }, null, true);

    // Clean expired widget cache every 30 minutes
    new CronJob('0 */30 * * * *', async () => {
      try {
        console.log('Cleaning expired widget cache...');
        await this.cleanExpiredCache();
        console.log('Widget cache cleanup completed');
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    }, null, true);

    // Generate daily analytics at midnight
    new CronJob('0 0 0 * * *', async () => {
      try {
        console.log('Generating daily analytics...');
        await this.generateDailyAnalytics();
        console.log('Daily analytics generated');
      } catch (error) {
        console.error('Analytics generation failed:', error);
      }
    }, null, true);

    // Check application health every 5 minutes
    new CronJob('0 */5 * * * *', async () => {
      try {
        await this.checkApplicationHealth();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, null, true);

    console.log('Dashboard background jobs started successfully');
  }

  private async cleanExpiredCache(): Promise<void> {
    await db.widget_data_cache.deleteMany({
      where: {
        expires_at: { lt: new Date() }
      }
    });
  }

  private async generateDailyAnalytics(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    // Calculate daily active users
    const dailyActiveUsers = await db.user_activity_log.groupBy({
      by: ['user_id'],
      where: {
        created_at: {
          gte: yesterday,
          lt: today
        }
      },
      _count: { user_id: true }
    });

    await this.recordMetric('daily_active_users', yesterday, dailyActiveUsers.length);

    // Calculate app launches
    const appLaunches = await db.user_activity_log.groupBy({
      by: ['target_app'],
      where: {
        activity_type: 'app_launch',
        created_at: {
          gte: yesterday,
          lt: today
        }
      },
      _count: { target_app: true }
    });

    for (const appLaunch of appLaunches) {
      await this.recordMetric(
        'app_launches', 
        yesterday, 
        appLaunch._count.target_app,
        { application_name: appLaunch.target_app }
      );
    }

    // Calculate widget interactions
    const widgetInteractions = await db.user_activity_log.count({
      where: {
        activity_type: 'widget_interaction',
        created_at: {
          gte: yesterday,
          lt: today
        }
      }
    });

    await this.recordMetric('widget_interactions', yesterday, widgetInteractions);
  }

  private async recordMetric(
    metricType: string, 
    date: Date, 
    value: number, 
    metadata: any = {}
  ): Promise<void> {
    await db.dashboard_metrics.upsert({
      where: {
        metric_type_metric_date_user_role_location_name_application_name: {
          metric_type: metricType,
          metric_date: date,
          user_role: metadata.user_role || null,
          location_name: metadata.location_name || null,
          application_name: metadata.application_name || null
        }
      },
      update: {
        metric_value: value,
        metric_metadata: metadata
      },
      create: {
        metric_type: metricType,
        metric_date: date,
        metric_value: value,
        metric_metadata: metadata,
        user_role: metadata.user_role,
        location_name: metadata.location_name,
        application_name: metadata.application_name
      }
    });
  }

  private async checkApplicationHealth(): Promise<void> {
    const applications = await db.platform_applications.findMany({
      where: { 
        is_active: true,
        health_check_url: { not: null }
      }
    });

    for (const app of applications) {
      try {
        const startTime = Date.now();
        const response = await fetch(app.health_check_url, {
          method: 'GET',
          timeout: 10000 // 10 second timeout
        });
        const responseTime = Date.now() - startTime;

        const status = response.ok ? 'healthy' : 'unhealthy';
        const errorMessage = response.ok ? null : `HTTP ${response.status}`;

        await db.application_health_status.upsert({
          where: { application_name: app.app_name },
          update: {
            current_status: status,
            last_check_at: new Date(),
            response_time_ms: responseTime,
            error_message: errorMessage
          },
          create: {
            application_name: app.app_name,
            health_check_url: app.health_check_url,
            current_status: status,
            response_time_ms: responseTime,
            error_message: errorMessage
          }
        });

        // Send alert if unhealthy
        if (!response.ok) {
          await this.sendHealthAlert(app, responseTime, errorMessage);
        }
      } catch (error) {
        console.error(`Health check failed for ${app.app_name}:`, error);
        
        await db.application_health_status.upsert({
          where: { application_name: app.app_name },
          update: {
            current_status: 'unhealthy',
            last_check_at: new Date(),
            error_message: error.message
          },
          create: {
            application_name: app.app_name,
            health_check_url: app.health_check_url,
            current_status: 'unhealthy',
            error_message: error.message
          }
        });
      }
    }
  }

  private async sendHealthAlert(app: any, responseTime: number, errorMessage: string): Promise<void> {
    // Send alert to administrators
    const admins = await db.users.findMany({
      where: { role: 'superadmin', is_active: true }
    });

    for (const admin of admins) {
      await db.notifications.create({
        data: {
          user_id: admin.id,
          title: `Application Health Alert: ${app.display_name}`,
          message: `${app.display_name} is experiencing issues. Response time: ${responseTime}ms. Error: ${errorMessage}`,
          type: 'warning',
          category: 'system_health'
        }
      });
    }
  }
}
```

---

## 🧪 Backend Testing

### **API Endpoint Testing**
```typescript
import { testApiHandler } from 'next-test-api-route-handler';
import dashboardHandler from '../../../pages/api/dashboard';

describe('/api/dashboard', () => {
  it('requires authentication', async () => {
    await testApiHandler({
      handler: dashboardHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });

  it('returns personalized dashboard data', async () => {
    await testApiHandler({
      handler: dashboardHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          }
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.preferences).toBeDefined();
        expect(data.data.widgets).toBeInstanceOf(Array);
      }
    });
  });

  it('filters widgets by user role', async () => {
    await testApiHandler({
      handler: dashboardHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          }
        });
        const data = await res.json();
        
        // Staff should not see manager-only widgets
        const hasManagerWidget = data.data.widgets.some(w => 
          w.widget_id === 'team_activity'
        );
        expect(hasManagerWidget).toBe(false);
      }
    });
  });
});

describe('Dashboard Aggregator', () => {
  it('aggregates widget data correctly', async () => {
    const aggregator = new DashboardAggregator();
    const mockUser = { id: '1', role: 'staff', email: 'test@gangerdermatology.com' };
    const widgets = [
      { widget_id: 'application_launcher' },
      { widget_id: 'notifications_center' }
    ];

    const result = await aggregator.aggregateWidgetData(widgets, mockUser);
    
    expect(result.application_launcher).toBeDefined();
    expect(result.notifications_center).toBeDefined();
    expect(result.application_launcher.applications).toBeInstanceOf(Array);
  });

  it('caches widget data appropriately', async () => {
    const aggregator = new DashboardAggregator();
    const mockUser = { id: '1', role: 'staff' };
    const widgets = [{ widget_id: 'application_launcher' }];

    // First call should generate data
    const result1 = await aggregator.aggregateWidgetData(widgets, mockUser);
    
    // Second call should use cache
    const result2 = await aggregator.aggregateWidgetData(widgets, mockUser);
    
    expect(result1).toEqual(result2);
  });
});

describe('Search Functionality', () => {
  it('performs full-text search correctly', async () => {
    await testApiHandler({
      handler: searchHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          },
          url: '?q=inventory'
        });
        
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.results.applications).toBeInstanceOf(Array);
      }
    });
  });

  it('respects role-based search filtering', async () => {
    // Test that staff can't see admin-only content in search
    await testApiHandler({
      handler: searchHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            authorization: 'Bearer ' + await getTestToken('staff')
          },
          url: '?q=configuration'
        });
        
        const data = await res.json();
        const hasAdminContent = data.results.applications.some(app => 
          app.title.includes('Configuration') && 
          app.required_roles?.includes('superadmin')
        );
        expect(hasAdminContent).toBe(false);
      }
    });
  });
});
```

---

## 📈 Success Criteria

### **Backend Launch Criteria**
- [ ] Database migrations executed successfully
- [ ] Dashboard API returns personalized data for all user roles
- [ ] Widget data aggregation works across all platform applications
- [ ] Search functionality indexes and queries content correctly
- [ ] Real-time notifications and presence systems operational
- [ ] Analytics collection and processing functional
- [ ] Application health monitoring active
- [ ] Row Level Security policies working correctly

### **Backend Success Metrics**
- API response times <500ms for dashboard data
- Widget data aggregation completes in <2 seconds
- Search results return in <300ms
- Real-time updates have <100ms latency
- Analytics processing completes daily without errors
- Application health checks succeed >99% of the time
- Cache hit rate >80% for widget data
- Zero security vulnerabilities in production

---

*This backend PRD provides comprehensive guidance for Terminal 2 to build all server-side functionality for the Platform Entrypoint Dashboard, with clear separation from Terminal 1's frontend responsibilities.*