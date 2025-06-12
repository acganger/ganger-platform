import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-eos';
import { supabase } from '@/lib/supabase';

export interface PresenceUser {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  page: string;
  last_seen: string;
}

export interface PresenceState {
  onlineUsers: PresenceUser[];
  myPresence: PresenceUser | null;
}

export function usePresence(page: string = 'dashboard'): PresenceState {
  const { user, activeTeam } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [myPresence, setMyPresence] = useState<PresenceUser | null>(null);

  useEffect(() => {
    if (!user || !activeTeam) return;

    const channelName = `team-${activeTeam.id}`;
    
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track my presence
    const trackPresence = () => {
      const presence: PresenceUser = {
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email || '',
        avatar_url: user.user_metadata?.avatar_url,
        page,
        last_seen: new Date().toISOString(),
      };

      setMyPresence(presence);
      
      presenceChannel.track(presence);
    };

    // Handle presence changes
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const users: PresenceUser[] = [];

        Object.keys(presenceState).forEach(userId => {
          const presences = presenceState[userId];
          if (presences && presences.length > 0) {
            // Get the most recent presence for this user
            const latestPresence = presences.reduce((latest, current) => {
              const currentTime = (current as any).last_seen || new Date().toISOString();
              const latestTime = (latest as any).last_seen || new Date().toISOString();
              return new Date(currentTime) > new Date(latestTime) 
                ? current 
                : latest;
            });
            users.push(latestPresence as unknown as PresenceUser);
          }
        });

        // Filter out current user and sort by last seen
        const otherUsers = users
          .filter(u => (u as any).user_id !== user?.id)
          .sort((a, b) => new Date((b as any).last_seen || new Date()).getTime() - new Date((a as any).last_seen || new Date()).getTime());

        setOnlineUsers(otherUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          trackPresence();
        }
      });

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      if (presenceChannel.state === 'joined') {
        trackPresence();
      }
    }, 30000);

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackPresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(presenceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, activeTeam, page]);

  return {
    onlineUsers,
    myPresence,
  };
}