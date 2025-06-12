import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Create a single instance of the Supabase client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

// Real-time subscription helpers for EOS data
export const subscribeToTeamUpdates = (
  teamId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`team-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToMeetingUpdates = (
  meetingId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`meeting-${meetingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'l10_meetings',
        filter: `id=eq.${meetingId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToRockUpdates = (
  teamId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`rocks-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rocks',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToIssueUpdates = (
  teamId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`issues-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'issues',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToTodoUpdates = (
  teamId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`todos-${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'todos',
        filter: `team_id=eq.${teamId}`,
      },
      callback
    )
    .subscribe();
};

// Meeting collaboration real-time presence
export const joinMeetingPresence = (meetingId: string, userId: string) => {
  const channel = supabase.channel(`meeting-presence-${meetingId}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  return channel;
};

// Offline data management
export const getOfflineData = () => {
  if (typeof window === 'undefined') return null;
  
  const data = localStorage.getItem('eos-offline-data');
  return data ? JSON.parse(data) : null;
};

export const setOfflineData = (data: any) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('eos-offline-data', JSON.stringify(data));
};

export const clearOfflineData = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('eos-offline-data');
};

// Connection status management
export const onConnectionStatusChange = (callback: (online: boolean) => void) => {
  if (typeof window === 'undefined') return;

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial status
  callback(navigator.onLine);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

export default supabase;