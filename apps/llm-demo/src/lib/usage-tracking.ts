import { supabase } from '@ganger/db';

export interface UsageRecord {
  user_id: string;
  user_email: string;
  endpoint: string;
  model: string;
  tokens_used: number;
  cost: number;
  timestamp: Date;
}

export async function trackUsage(record: UsageRecord) {
  try {
    // Insert usage record
    const { error } = await supabase
      .from('llm_usage_tracking')
      .insert({
        user_id: record.user_id,
        user_email: record.user_email,
        endpoint: record.endpoint,
        model: record.model,
        tokens_used: record.tokens_used,
        cost: record.cost,
        created_at: record.timestamp.toISOString()
      });
      
    if (error) {
      console.error('Failed to track usage:', error);
    }
  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't throw - usage tracking should not break the API
  }
}

export async function getUserUsage(userId: string, days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const { data, error } = await supabase
      .from('llm_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Failed to get usage:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Get usage error:', error);
    return null;
  }
}