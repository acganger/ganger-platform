// User Activity Logging Service
// Terminal 2: Backend Implementation

// Types imported inline as needed

export async function logUserActivity(
  supabase: any,
  activity: {
    user_id: string;
    activity_type: 'app_launch' | 'widget_interaction' | 'quick_action' | 'dashboard_view' | 'search' | 'dashboard_customization';
    target_app?: string;
    target_widget?: string;
    target_action?: string;
    session_id?: string;
    time_spent_seconds?: number;
    interaction_count?: number;
    metadata?: Record<string, any>;
    user_agent?: string;
    ip_address?: string;
    location_context?: string;
  }
): Promise<void> {
  try {
    const activityData = {
      user_id: activity.user_id,
      activity_type: activity.activity_type,
      target_app: activity.target_app || null,
      target_widget: activity.target_widget || null,
      target_action: activity.target_action || null,
      session_id: activity.session_id || null,
      time_spent_seconds: activity.time_spent_seconds || null,
      interaction_count: activity.interaction_count || 1,
      metadata: activity.metadata || {},
      user_agent: activity.user_agent || null,
      ip_address: activity.ip_address || null,
      location_context: activity.location_context || null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_activity_log')
      .insert(activityData);

    if (error) {
    }
  } catch (error) {
  }
}

export async function getUserActivitySummary(
  supabase: any,
  userId: string,
  timeRange: 'day' | 'week' | 'month' = 'week'
): Promise<{
  totalActivities: number;
  appLaunches: number;
  widgetInteractions: number;
  quickActions: number;
  searchQueries: number;
  mostUsedApps: Array<{ app: string; count: number }>;
  activityTimeline: Array<{ date: string; count: number }>;
}> {
  try {
    const now = new Date();
    const timeRanges = {
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };

    const startDate = timeRanges[timeRange];

    // Get activity counts by type
    const { data: activityCounts } = await supabase
      .from('user_activity_log')
      .select('activity_type, target_app, created_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    const activities = activityCounts || [];

    // Calculate summaries
    const totalActivities = activities.length;
    const appLaunches = activities.filter((a: any) => a.activity_type === 'app_launch').length;
    const widgetInteractions = activities.filter((a: any) => a.activity_type === 'widget_interaction').length;
    const quickActions = activities.filter((a: any) => a.activity_type === 'quick_action').length;
    const searchQueries = activities.filter((a: any) => a.activity_type === 'search').length;

    // Most used apps
    const appUsage = activities
      .filter((a: any) => a.activity_type === 'app_launch' && a.target_app)
      .reduce((acc: Record<string, number>, activity: any) => {
        acc[activity.target_app] = (acc[activity.target_app] || 0) + 1;
        return acc;
      }, {});

    const mostUsedApps = Object.entries(appUsage)
      .map(([app, count]) => ({ app, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Activity timeline (daily breakdown)
    const timelineMap = activities.reduce((acc: Record<string, number>, activity: any) => {
      const date = new Date(activity.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const activityTimeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count: count as number }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalActivities,
      appLaunches,
      widgetInteractions,
      quickActions,
      searchQueries,
      mostUsedApps,
      activityTimeline
    };
  } catch (error) {
    return {
      totalActivities: 0,
      appLaunches: 0,
      widgetInteractions: 0,
      quickActions: 0,
      searchQueries: 0,
      mostUsedApps: [],
      activityTimeline: []
    };
  }
}

export async function logWidgetInteraction(
  supabase: any,
  userId: string,
  widgetId: string,
  interactionType: 'view' | 'click' | 'expand' | 'refresh' | 'configure',
  sessionId?: string,
  timeSpent?: number
): Promise<void> {
  await logUserActivity(supabase, {
    user_id: userId,
    activity_type: 'widget_interaction',
    target_widget: widgetId,
    session_id: sessionId,
    time_spent_seconds: timeSpent,
    metadata: {
      interaction_type: interactionType,
      timestamp: new Date().toISOString()
    }
  });
}

export async function logAppLaunch(
  supabase: any,
  userId: string,
  appName: string,
  sessionId?: string,
  source?: 'dashboard' | 'quick_action' | 'search' | 'direct'
): Promise<void> {
  await logUserActivity(supabase, {
    user_id: userId,
    activity_type: 'app_launch',
    target_app: appName,
    session_id: sessionId,
    metadata: {
      launch_source: source || 'unknown',
      timestamp: new Date().toISOString()
    }
  });
}

export async function logQuickAction(
  supabase: any,
  userId: string,
  actionId: string,
  executionTime?: number,
  success?: boolean,
  sessionId?: string
): Promise<void> {
  await logUserActivity(supabase, {
    user_id: userId,
    activity_type: 'quick_action',
    target_action: actionId,
    session_id: sessionId,
    time_spent_seconds: executionTime,
    metadata: {
      execution_success: success,
      execution_time_ms: executionTime ? executionTime * 1000 : undefined,
      timestamp: new Date().toISOString()
    }
  });
}

export async function logSearchQuery(
  supabase: any,
  userId: string,
  query: string,
  resultsCount: number,
  sessionId?: string
): Promise<void> {
  await logUserActivity(supabase, {
    user_id: userId,
    activity_type: 'search',
    target_action: 'global_search',
    session_id: sessionId,
    metadata: {
      search_query: query,
      results_count: resultsCount,
      query_length: query.length,
      timestamp: new Date().toISOString()
    }
  });
}