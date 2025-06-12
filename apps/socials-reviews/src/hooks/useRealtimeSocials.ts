'use client'

import { useEffect, useState } from 'react';
import { supabase, REALTIME_CHANNELS } from '@/lib/supabase';
import type { 
  GoogleBusinessReview, 
  SocialMediaPost, 
  NotificationEvent,
  RealtimeEvent 
} from '@/types';

export interface UseRealtimeSocialsOptions {
  enableReviews?: boolean;
  enableSocialPosts?: boolean;
  enableNotifications?: boolean;
}

export interface UseRealtimeSocialsResult {
  isConnected: boolean;
  newReviews: GoogleBusinessReview[];
  newPosts: SocialMediaPost[];
  notifications: NotificationEvent[];
  clearNewReviews: () => void;
  clearNewPosts: () => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

export function useRealtimeSocials(options: UseRealtimeSocialsOptions = {}): UseRealtimeSocialsResult {
  const {
    enableReviews = true,
    enableSocialPosts = true,
    enableNotifications = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [newReviews, setNewReviews] = useState<GoogleBusinessReview[]>([]);
  const [newPosts, setNewPosts] = useState<SocialMediaPost[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  useEffect(() => {
    let reviewsChannel: ReturnType<typeof supabase.channel> | null = null;
    let postsChannel: ReturnType<typeof supabase.channel> | null = null;
    let notificationsChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscriptions = () => {
      // Reviews subscription
      if (enableReviews) {
        reviewsChannel = supabase
          .channel(REALTIME_CHANNELS.REVIEWS)
          .on(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'postgres_changes' as any,
            {
              event: 'INSERT',
              schema: 'public',
              table: 'google_business_reviews',
            },
            (payload: RealtimeEvent<GoogleBusinessReview>) => {
              // Handle new review
              void payload;
              if (payload.new) {
                const newReview = payload.new as GoogleBusinessReview;
                setNewReviews(prev => [newReview, ...prev]);
                
                // Generate notification for new review
                const notification: NotificationEvent = {
                  id: `review_${newReview.id}_${Date.now()}`,
                  type: 'new_review',
                  title: `New Review - ${newReview.business_location.replace('_', ' ')}`,
                  message: `${newReview.reviewer_name} left a ${newReview.rating}-star review`,
                  data: { reviewId: newReview.id, location: newReview.business_location },
                  timestamp: new Date().toISOString(),
                  read: false,
                };
                
                setNotifications(prev => [notification, ...prev]);
              }
            }
          )
          .on(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'postgres_changes' as any,
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'google_business_reviews',
              filter: 'urgency_level=eq.critical',
            },
            (payload: RealtimeEvent<GoogleBusinessReview>) => {
              // Handle urgent review
              void payload;
              if (payload.new && payload.new.urgency_level === 'critical') {
                const notification: NotificationEvent = {
                  id: `urgent_review_${payload.new.id}_${Date.now()}`,
                  type: 'urgent_review',
                  title: 'Urgent Review Requires Attention',
                  message: `${payload.new.reviewer_name}'s review has been marked as critical priority`,
                  data: { reviewId: payload.new.id, urgency: payload.new.urgency_level },
                  timestamp: new Date().toISOString(),
                  read: false,
                };
                
                setNotifications(prev => [notification, ...prev]);
              }
            }
          )
          .subscribe((status) => {
            // Reviews subscription status
            void status;
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
            } else if (status === 'CLOSED') {
              setIsConnected(false);
            }
          });
      }

      // Social posts subscription
      if (enableSocialPosts) {
        postsChannel = supabase
          .channel(REALTIME_CHANNELS.SOCIAL_POSTS)
          .on(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'postgres_changes' as any,
            {
              event: 'INSERT',
              schema: 'public',
              table: 'social_media_posts',
              filter: 'is_high_performing=eq.true',
            },
            (payload: RealtimeEvent<SocialMediaPost>) => {
              // Handle high-performing post
              void payload;
              if (payload.new) {
                const newPost = payload.new as SocialMediaPost;
                setNewPosts(prev => [newPost, ...prev]);
                
                // Generate notification for high-performing post
                const notification: NotificationEvent = {
                  id: `post_${newPost.id}_${Date.now()}`,
                  type: 'high_performing_post',
                  title: 'High-Performing Post Discovered',
                  message: `${newPost.account_name}'s ${newPost.platform} post has ${(newPost.engagement_rate * 100).toFixed(1)}% engagement`,
                  data: { postId: newPost.id, platform: newPost.platform },
                  timestamp: new Date().toISOString(),
                  read: false,
                };
                
                setNotifications(prev => [notification, ...prev]);
              }
            }
          )
          .subscribe((status) => {
            // Social posts subscription status
            void status;
          });
      }

      // Notifications subscription (for content ready, etc.)
      if (enableNotifications) {
        notificationsChannel = supabase
          .channel(REALTIME_CHANNELS.NOTIFICATIONS)
          .on(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'postgres_changes' as any,
            {
              event: 'INSERT',
              schema: 'public',
              table: 'adapted_content',
              filter: 'adaptation_status=eq.completed',
            },
            (payload: RealtimeEvent) => {
              // Handle content adaptation
              void payload;
              
              const notification: NotificationEvent = {
                id: `content_${(payload.new as { id?: string })?.id || 'unknown'}_${Date.now()}`,
                type: 'content_ready',
                title: 'Adapted Content Ready',
                message: 'AI has finished adapting content for Ganger Dermatology',
                data: { contentId: (payload.new as { id?: string })?.id },
                timestamp: new Date().toISOString(),
                read: false,
              };
              
              setNotifications(prev => [notification, ...prev]);
            }
          )
          .subscribe((status) => {
            // Notifications subscription status
            void status;
          });
      }
    };

    // Setup subscriptions
    setupRealtimeSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      if (reviewsChannel) {
        supabase.removeChannel(reviewsChannel);
      }
      if (postsChannel) {
        supabase.removeChannel(postsChannel);
      }
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
    };
  }, [enableReviews, enableSocialPosts, enableNotifications]);

  // Handle connection status monitoring
  useEffect(() => {
    const handleConnectionChange = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  const clearNewReviews = () => {
    setNewReviews([]);
  };

  const clearNewPosts = () => {
    setNewPosts([]);
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return {
    isConnected,
    newReviews,
    newPosts,
    notifications,
    clearNewReviews,
    clearNewPosts,
    markNotificationRead,
    markAllNotificationsRead,
  };
}

// Hook for managing review-specific real-time data
export function useRealtimeReviews() {
  return useRealtimeSocials({
    enableReviews: true,
    enableSocialPosts: false,
    enableNotifications: false,
  });
}

// Hook for managing social posts-specific real-time data
export function useRealtimeSocialPosts() {
  return useRealtimeSocials({
    enableReviews: false,
    enableSocialPosts: true,
    enableNotifications: false,
  });
}

// Hook for managing notifications only
export function useRealtimeNotifications() {
  return useRealtimeSocials({
    enableReviews: false,
    enableSocialPosts: false,
    enableNotifications: true,
  });
}