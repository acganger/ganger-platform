import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Medication Authorization specific real-time subscriptions
export const subscribeToAuthorizationUpdates = (
  authorizationId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`authorization-${authorizationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'authorization_requests',
        filter: `id=eq.${authorizationId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToUserAuthorizations = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`user-authorizations-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'authorization_requests',
        filter: `created_by=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToAIRecommendations = (
  authorizationId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`ai-recommendations-${authorizationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_recommendations',
        filter: `authorization_id=eq.${authorizationId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToSystemNotifications = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};