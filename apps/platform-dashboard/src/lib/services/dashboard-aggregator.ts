// Dashboard Widget Data Aggregation Service
// Terminal 2: Backend Implementation

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { GoogleWorkspaceClient } from '@/lib/integrations/google-workspace';
import { ServerCacheService } from '@/lib/services/cache-service';
import type { User, WidgetData } from '@/types/dashboard';

export class DashboardAggregator {
  private cache: ServerCacheService;
  private supabase: any;

  constructor() {
    this.cache = new ServerCacheService();
    this.supabase = createServerSupabaseClient();
  }

  async aggregateWidgetData(widgets: any[], user: User): Promise<Record<string, any>> {
    const widgetData: Record<string, any> = {};

    // Process widgets in parallel for better performance
    const widgetPromises = widgets.map(async (widget) => {
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
        
        return { widgetId: widget.widget_id, data };
      } catch (error) {
        return { 
          widgetId: widget.widget_id, 
          data: { error: 'Failed to load data', timestamp: new Date().toISOString() } 
        };
      }
    });

    // Wait for all widgets to complete
    const results = await Promise.all(widgetPromises);
    
    // Organize results by widget ID
    results.forEach(({ widgetId, data }) => {
      widgetData[widgetId] = data;
    });

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
      
      case 'system_health':
        return await this.getSystemHealthData(user);
      
      default:
        return { 
          message: 'Widget not implemented',
          timestamp: new Date().toISOString()
        };
    }
  }

  private async getApplicationLauncherData(user: User) {
    try {
      // Get applications accessible to user
      const { data: applications } = await this.supabase
        .from('platform_applications')
        .select('*')
        .eq('is_active', true)
        .or(`required_roles.cs.{},required_roles.cs.{${user.role}}`)
        .order('display_name');

      // Get user's recent app launches
      const { data: recentLaunches } = await this.supabase
        .from('user_activity_log')
        .select('target_app, created_at, interaction_count')
        .eq('user_id', user.id)
        .eq('activity_type', 'app_launch')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      // Calculate app usage frequency
      const appUsage = (recentLaunches || []).reduce((acc: Record<string, number>, launch: any) => {
        acc[launch.target_app] = (acc[launch.target_app] || 0) + (launch.interaction_count || 1);
        return acc;
      }, {});

      // Sort apps by usage frequency
      const sortedApps = (applications || []).sort((a: any, b: any) => {
        const usageA = appUsage[a.app_name] || 0;
        const usageB = appUsage[b.app_name] || 0;
        return usageB - usageA;
      });

      return {
        applications: sortedApps,
        recentApps: sortedApps.slice(0, 6),
        totalApps: sortedApps.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  private async getNotificationCenterData(user: User) {
    try {
      const { data: notifications } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      const notificationList = notifications || [];
      const unreadCount = notificationList.filter((n: any) => !n.read_at).length;

      return {
        notifications: notificationList.slice(0, 5), // Show only recent 5
        unreadCount,
        totalCount: notificationList.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        notifications: [],
        unreadCount: 0,
        totalCount: 0,
        error: 'Failed to load notifications',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getTeamActivityData(user: User) {
    try {
      // Get team members in same location
      const { data: teamMembers } = await this.supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('primary_location', user.primary_location)
        .eq('is_active', true)
        .neq('id', user.id); // Exclude current user

      const teamMemberIds = (teamMembers || []).map((tm: any) => tm.id);

      if (teamMemberIds.length === 0) {
        return {
          activities: [],
          teamMemberCount: 0,
          activeToday: 0,
          message: 'No team members found',
          timestamp: new Date().toISOString()
        };
      }

      // Get recent team activities
      const { data: activities } = await this.supabase
        .from('user_activity_log')
        .select(`
          *,
          user:users(name, email, avatar_url)
        `)
        .in('user_id', teamMemberIds)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const activityList = activities || [];

      return {
        activities: activityList,
        teamMemberCount: teamMembers?.length || 0,
        activeToday: activityList.filter((a: any) => 
          new Date(a.created_at) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        activities: [],
        teamMemberCount: 0,
        activeToday: 0,
        error: 'Failed to load team activity',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getUpcomingMeetingsData(user: User) {
    try {
      // Integrate with Google Calendar
      const googleClient = new GoogleWorkspaceClient();
      const meetings = await googleClient.getUpcomingMeetings(user?.email, {
        maxResults: 5,
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next 24 hours
      });

      return {
        meetings: meetings.map((meeting: any) => ({
          id: meeting.id,
          title: meeting.summary,
          start: meeting.start?.dateTime || meeting.start?.date,
          end: meeting.end?.dateTime || meeting.end?.date,
          attendees: meeting.attendees?.length || 0,
          location: meeting.location,
          meetingUrl: meeting.hangoutLink || meeting.conferenceData?.entryPoints?.[0]?.uri
        })),
        totalMeetings: meetings.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        meetings: [], 
        totalMeetings: 0,
        error: 'Failed to connect to calendar',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getPendingApprovalsData(user: User) {
    try {
      // This would integrate with various approval systems
      // For now, we'll check staff portal and other systems

      const approvals: any[] = [];

      // Check staff portal for pending approvals (mock implementation)
      if (user.role === 'manager' || user.role === 'superadmin') {
        // Get pending time off requests, support tickets, etc.
        // This would be expanded based on actual approval workflows
        
        return {
          approvals: [],
          totalPending: 0,
          urgentCount: 0,
          message: 'No pending approvals',
          timestamp: new Date().toISOString()
        };
      }

      return {
        approvals: [],
        totalPending: 0,
        urgentCount: 0,
        message: 'No approval permissions',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        approvals: [],
        totalPending: 0,
        urgentCount: 0,
        error: 'Failed to load approvals',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getRecentDocumentsData(user: User) {
    try {
      // This would integrate with Google Drive
      const googleClient = new GoogleWorkspaceClient();
      const documents = await googleClient.getRecentDocuments(user?.email, {
        maxResults: 8
      });

      return {
        documents: documents || [],
        totalDocuments: documents?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        documents: [],
        totalDocuments: 0,
        error: 'Failed to connect to Google Drive',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getQuickActionsData(user: User) {
    try {
      const { data: actions } = await this.supabase
        .from('quick_actions')
        .select('*')
        .eq('is_active', true)
        .or(`required_roles.cs.{},required_roles.cs.{${user.role}}`)
        .order('display_order')
        .limit(6);

      return {
        actions: actions || [],
        totalActions: actions?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        actions: [],
        totalActions: 0,
        error: 'Failed to load quick actions',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getHelpCenterData(user: User) {
    try {
      // Get recent help articles and support stats
      const { data: helpArticles } = await this.supabase
        .from('search_index')
        .select('*')
        .eq('content_type', 'help_article')
        .or(`required_roles.cs.{},required_roles.cs.{${user.role}}`)
        .order('last_modified', { ascending: false })
        .limit(5);

      return {
        recentArticles: helpArticles || [],
        totalArticles: helpArticles?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        recentArticles: [],
        totalArticles: 0,
        error: 'Failed to load help center',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getSystemHealthData(user: User) {
    try {
      if (user.role !== 'superadmin') {
        return {
          error: 'Access denied',
          timestamp: new Date().toISOString()
        };
      }

      const { data: healthStatuses } = await this.supabase
        .from('application_health_status')
        .select('*')
        .order('application_name');

      const statuses = healthStatuses || [];
      const healthyCount = statuses.filter((s: any) => s.current_status === 'healthy').length;
      const totalCount = statuses.length;

      return {
        applications: statuses,
        healthyCount,
        totalCount,
        overallHealth: totalCount > 0 ? (healthyCount / totalCount) * 100 : 100,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        applications: [],
        healthyCount: 0,
        totalCount: 0,
        overallHealth: 0,
        error: 'Failed to load system health',
        timestamp: new Date().toISOString()
      };
    }
  }

  private getWidgetCacheTTL(widgetId: string): number {
    // Define cache TTL per widget type (in seconds)
    const cacheTTLs: Record<string, number> = {
      application_launcher: 3600, // 1 hour
      notifications_center: 60,   // 1 minute
      team_activity: 300,         // 5 minutes
      pending_approvals: 300,     // 5 minutes
      upcoming_meetings: 900,     // 15 minutes
      recent_documents: 600,      // 10 minutes
      quick_actions: 3600,        // 1 hour
      help_center: 7200,          // 2 hours
      system_health: 300          // 5 minutes
    };

    return cacheTTLs[widgetId] || 300; // Default 5 minutes
  }
}