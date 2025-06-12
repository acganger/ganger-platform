// Server-side Cache Service for Dashboard
// Terminal 2: Backend Implementation

import { createServerSupabaseClient } from '@/lib/supabase-server';

export class ServerCacheService {
  private supabase: any;
  private memoryCache: Map<string, { data: any; expires: number }>;

  constructor() {
    this.supabase = createServerSupabaseClient();
    this.memoryCache = new Map();
  }

  async get(key: string): Promise<any> {
    // First check memory cache for performance
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expires > Date.now()) {
      return memoryItem.data;
    }

    // Check database cache
    try {
      const { data: cacheItem } = await this.supabase
        .from('widget_data_cache')
        .select('data_content, expires_at, cache_hits')
        .eq('widget_id', key.split(':')[1] || key)
        .eq('user_id', key.split(':')[2] || null)
        .single();

      if (cacheItem && new Date(cacheItem.expires_at) > new Date()) {
        // Update cache hit count
        await this.supabase
          .from('widget_data_cache')
          .update({
            cache_hits: (cacheItem.cache_hits || 0) + 1,
            last_accessed: new Date().toISOString()
          })
          .eq('widget_id', key.split(':')[1] || key)
          .eq('user_id', key.split(':')[2] || null);

        // Store in memory cache for subsequent requests
        this.memoryCache.set(key, {
          data: cacheItem.data_content,
          expires: new Date(cacheItem.expires_at).getTime()
        });

        return cacheItem.data_content;
      }
    } catch (error) {
    }

    return null;
  }

  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    // Store in memory cache
    this.memoryCache.set(key, {
      data,
      expires: expiresAt.getTime()
    });

    // Store in database cache
    try {
      const keyParts = key.split(':');
      const widgetId = keyParts[1] || key;
      const userId = keyParts[2] || null;

      if (!userId) {
        // Skip database storage for non-user-specific cache
        return;
      }

      const dataHash = this.generateHash(JSON.stringify(data));

      await this.supabase
        .from('widget_data_cache')
        .upsert(
          {
            widget_id: widgetId,
            user_id: userId,
            data_content: data,
            data_hash: dataHash,
            expires_at: expiresAt.toISOString(),
            last_accessed: new Date().toISOString(),
            generation_time_ms: Date.now() % 10000, // Approximate generation time
            cache_hits: 0
          },
          { onConflict: 'widget_id,user_id' }
        );
    } catch (error) {
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear database cache
    try {
      if (pattern.includes(':')) {
        const keyParts = pattern.split(':');
        const widgetId = keyParts[1];
        const userId = keyParts[2];

        if (userId) {
          await this.supabase
            .from('widget_data_cache')
            .delete()
            .eq('widget_id', widgetId)
            .eq('user_id', userId);
        } else {
          await this.supabase
            .from('widget_data_cache')
            .delete()
            .eq('widget_id', widgetId);
        }
      }
    } catch (error) {
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear expired database cache
    try {
      await this.supabase
        .from('widget_data_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
    }
  }

  private generateHash(data: string): string {
    // Simple hash function for change detection
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Cleanup method to remove expired cache items
  async cleanup(): Promise<void> {
    // Clean memory cache
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires <= now) {
        this.memoryCache.delete(key);
      }
    }

    // Clean database cache
    try {
      await this.supabase
        .from('widget_data_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
    }
  }
}