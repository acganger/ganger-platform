// Real Database Connection for Platform Dashboard
// Simplified approach that works with Next.js build system

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for server-side operations
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const db = {
  async query(text: string, params?: any[]) {
    try {
      // Execute queries using Supabase client methods instead of raw SQL
      const result = await executeSupabaseQuery(text, params);
      return result;
    } catch (error) {
      throw error;
    }
  }
};

// Execute queries using Supabase client methods instead of raw SQL
async function executeSupabaseQuery(text: string, params?: any[]): Promise<any[]> {
  const normalizedText = text.toLowerCase().trim();
  
  // User dashboard preferences queries
  if (normalizedText.includes('user_dashboard_preferences')) {
    if (normalizedText.includes('insert')) {
      const { data, error } = await supabaseAdmin
        .from('user_dashboard_preferences')
        .insert({
          user_id: params?.[0],
          layout_columns: params?.[1] || 3,
          widget_arrangement: params?.[2] ? JSON.parse(params[2]) : [],
          theme_preference: params?.[3] || 'system'
        })
        .select()
        .single();
      
      if (error) throw error;
      return [data];
    }
    
    if (normalizedText.includes('update')) {
      const { data, error } = await supabaseAdmin
        .from('user_dashboard_preferences')
        .update({
          layout_columns: params?.[1],
          widget_arrangement: params?.[2] ? JSON.parse(params[2]) : undefined,
          theme_preference: params?.[3],
          show_weather: params?.[4],
          show_team_activity: params?.[5],
          show_recent_documents: params?.[6],
          show_upcoming_meetings: params?.[7],
          desktop_notifications: params?.[8],
          notification_sound: params?.[9],
          quiet_hours_start: params?.[10],
          quiet_hours_end: params?.[11],
          pinned_applications: params?.[12],
          custom_quick_actions: params?.[13] ? JSON.parse(params[13]) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', params?.[0])
        .select();
      
      if (error) throw error;
      return data;
    }
    
    // SELECT query
    const { data, error } = await supabaseAdmin
      .from('user_dashboard_preferences')
      .select('*')
      .eq('user_id', params?.[0]);
    
    if (error) throw error;
    return data || [];
  }
  
  // Dashboard widgets queries
  if (normalizedText.includes('dashboard_widgets')) {
    const { data, error } = await supabaseAdmin
      .from('dashboard_widgets')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) throw error;
    return data || [];
  }
  
  // Quick actions queries
  if (normalizedText.includes('quick_actions')) {
    const { data, error } = await supabaseAdmin
      .from('quick_actions')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) throw error;
    return data || [];
  }
  
  // Platform announcements queries
  if (normalizedText.includes('platform_announcements')) {
    const { data, error } = await supabaseAdmin
      .from('platform_announcements')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // Platform applications queries
  if (normalizedText.includes('platform_applications')) {
    const { data, error } = await supabaseAdmin
      .from('platform_applications')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    return data || [];
  }
  
  // Widget data cache queries
  if (normalizedText.includes('widget_data_cache')) {
    if (normalizedText.includes('select')) {
      const { data, error } = await supabaseAdmin
        .from('widget_data_cache')
        .select('*')
        .eq('widget_id', params?.[0])
        .eq('user_id', params?.[1])
        .gt('expires_at', new Date().toISOString());
      
      if (error) throw error;
      return data || [];
    }
    
    if (normalizedText.includes('insert') || normalizedText.includes('upsert')) {
      const { data, error } = await supabaseAdmin
        .from('widget_data_cache')
        .upsert({
          widget_id: params?.[0],
          user_id: params?.[1],
          data_content: params?.[2] ? JSON.parse(params[2]) : {},
          expires_at: params?.[3],
          cached_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      return data || [];
    }
    
    if (normalizedText.includes('update')) {
      const { data, error } = await supabaseAdmin
        .from('widget_data_cache')
        .update({
          last_accessed: new Date().toISOString(),
          cache_hits: 1
        })
        .eq('widget_id', params?.[0])
        .eq('user_id', params?.[1])
        .select();
      
      if (error) throw error;
      return data || [];
    }
  }
  
  // User activity log queries
  if (normalizedText.includes('user_activity_log')) {
    if (normalizedText.includes('insert')) {
      const { data, error } = await supabaseAdmin
        .from('user_activity_log')
        .insert({
          user_id: params?.[0],
          activity_type: params?.[1],
          target_app: params?.[2],
          target_widget: params?.[3],
          target_action: params?.[4],
          session_id: params?.[5],
          metadata: params?.[6] ? JSON.parse(params[6]) : null
        })
        .select();
      
      if (error) throw error;
      return data || [];
    }
    
    // SELECT queries for activity logs
    const { data, error } = await supabaseAdmin
      .from('user_activity_log')
      .select(`
        *,
        user:users(name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  }
  
  // Search index queries
  if (normalizedText.includes('search_index')) {
    if (normalizedText.includes('delete')) {
      const { error } = await supabaseAdmin
        .from('search_index')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
      return [];
    }
    
    if (normalizedText.includes('insert')) {
      const { data, error } = await supabaseAdmin
        .from('search_index')
        .upsert({
          content_type: params?.[0],
          content_id: params?.[1],
          title: params?.[2],
          content: params?.[3],
          excerpt: params?.[4],
          url: params?.[5],
          icon_url: params?.[6],
          keywords: params?.[7],
          categories: params?.[8],
          required_roles: params?.[9]
        })
        .select();
      
      if (error) throw error;
      return data || [];
    }
    
    // Search queries
    const { data, error } = await supabaseAdmin
      .from('search_index')
      .select('*')
      .textSearch('content', params?.[0] || '', { type: 'websearch' })
      .limit(params?.[2] || 20);
    
    if (error) throw error;
    return data || [];
  }
  
  // Users queries
  if (normalizedText.includes('users')) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  }
  
  // Application health status queries
  if (normalizedText.includes('application_health_status')) {
    const { data, error } = await supabaseAdmin
      .from('application_health_status')
      .select('*')
      .order('last_check_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // Default: return empty array for unmatched queries
  return [];
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}