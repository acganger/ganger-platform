/**
 * @fileoverview Intelligent caching system for AI responses
 * Reduces API calls, improves response times, and saves costs
 */

import crypto from 'crypto';
import type { ChatMessage, AIModel, ApplicationContext } from '../shared/types';

/**
 * Cache entry structure
 */
interface CacheEntry<T = any> {
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
  metadata?: {
    model: AIModel;
    app: ApplicationContext;
    cost?: number;
    responseTime?: number;
  };
}

/**
 * Cache configuration
 */
interface CacheConfig {
  defaultTtlMs: number;
  maxEntries: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl';
  enableCompression: boolean;
  enableMetrics: boolean;
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  entries: number;
  memoryUsageBytes: number;
  hitRate: number;
  averageResponseTime: number;
  costSaved: number;
}

/**
 * Smart cache key generator
 */
class CacheKeyGenerator {
  /**
   * Generate cache key for AI chat request
   */
  static generateChatKey(
    messages: ChatMessage[],
    model: AIModel,
    config?: any
  ): string {
    // Normalize messages to ensure consistent keys
    const normalizedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content.trim().toLowerCase()
    }));

    // Include relevant config in key
    const relevantConfig = {
      model,
      temperature: config?.temperature,
      maxTokens: config?.maxTokens
    };

    const keyData = {
      messages: normalizedMessages,
      config: relevantConfig
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Generate semantic similarity key for fuzzy matching
   */
  static generateSemanticKey(content: string): string {
    // Simple semantic normalization
    const normalized = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract key concepts (simple approach)
    const words = normalized.split(' ');
    const keyWords = words
      .filter(word => word.length > 3)
      .sort()
      .slice(0, 10)
      .join(' ');

    return crypto
      .createHash('md5')
      .update(keyWords)
      .digest('hex')
      .substring(0, 16);
  }
}

/**
 * In-memory cache with intelligent eviction
 */
export class AIResponseCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    entries: 0,
    memoryUsageBytes: 0,
    hitRate: 0,
    averageResponseTime: 0,
    costSaved: 0
  };

  constructor(private config: CacheConfig = {
    defaultTtlMs: 5 * 60 * 1000, // 5 minutes
    maxEntries: 1000,
    evictionPolicy: 'lru',
    enableCompression: false,
    enableMetrics: true
  }) {}

  /**
   * Get cached response
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update access info
    entry.hits++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    if (entry.metadata?.cost) {
      this.stats.costSaved += entry.metadata.cost;
    }
    
    this.updateStats();
    return entry.value as T;
  }

  /**
   * Set cache entry
   */
  set<T>(
    key: string, 
    value: T, 
    options: {
      ttlMs?: number;
      metadata?: CacheEntry['metadata'];
    } = {}
  ): void {
    const ttlMs = options.ttlMs || this.config.defaultTtlMs;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + ttlMs,
      hits: 0,
      lastAccessed: now,
      metadata: options.metadata
    };

    // Evict if at capacity
    if (this.cache.size >= this.config.maxEntries) {
      this.evictEntries(1);
    }

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Cache AI chat response
   */
  cacheResponse(
    messages: ChatMessage[],
    model: AIModel,
    response: string,
    metadata: {
      app: ApplicationContext;
      cost?: number;
      responseTime?: number;
      config?: any;
    }
  ): string {
    const key = CacheKeyGenerator.generateChatKey(messages, model, metadata.config);
    
    this.set(key, response, {
      ttlMs: this.getTtlForContext(metadata.app),
      metadata: {
        model,
        app: metadata.app,
        cost: metadata.cost,
        responseTime: metadata.responseTime
      }
    });

    return key;
  }

  /**
   * Get cached AI response
   */
  getCachedResponse(
    messages: ChatMessage[],
    model: AIModel,
    config?: any
  ): string | null {
    const key = CacheKeyGenerator.generateChatKey(messages, model, config);
    return this.get<string>(key);
  }

  /**
   * Find similar cached responses using semantic similarity
   */
  findSimilarResponse(
    messages: ChatMessage[],
    model: AIModel,
    similarityThreshold = 0.8
  ): { response: string; similarity: number; key: string } | null {
    if (messages.length === 0) return null;

    const lastMessage = messages[messages.length - 1];
    const semanticKey = CacheKeyGenerator.generateSemanticKey(lastMessage.content);

    // Simple similarity search (in production, use vector similarity)
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata?.model === model) {
        // Basic similarity check
        const similarity = this.calculateSimilarity(semanticKey, key);
        if (similarity >= similarityThreshold) {
          const response = this.get<string>(key);
          if (response) {
            return { response, similarity, key };
          }
        }
      }
    }

    return null;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0;
    
    for (const [key] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.stats.evictions += invalidated;
    this.updateStats();
    return invalidated;
  }

  /**
   * Invalidate cache entries by app
   */
  invalidateByApp(app: ApplicationContext): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata?.app === app) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.stats.evictions += invalidated;
    this.updateStats();
    return invalidated;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.stats.evictions += this.cache.size;
    this.cache.clear();
    this.updateStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache analysis
   */
  analyze(): {
    topModels: Array<{ model: AIModel; usage: number }>;
    topApps: Array<{ app: ApplicationContext; usage: number }>;
    expirationTimes: Array<{ key: string; expiresIn: number }>;
    memoryDistribution: Record<string, number>;
  } {
    const modelUsage = new Map<AIModel, number>();
    const appUsage = new Map<ApplicationContext, number>();
    const expirationTimes: Array<{ key: string; expiresIn: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata?.model) {
        modelUsage.set(entry.metadata.model, (modelUsage.get(entry.metadata.model) || 0) + entry.hits);
      }
      if (entry.metadata?.app) {
        appUsage.set(entry.metadata.app, (appUsage.get(entry.metadata.app) || 0) + entry.hits);
      }
      
      expirationTimes.push({
        key: key.substring(0, 8) + '...',
        expiresIn: Math.max(0, entry.expiresAt - Date.now())
      });
    }

    return {
      topModels: Array.from(modelUsage.entries())
        .map(([model, usage]) => ({ model, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10),
      topApps: Array.from(appUsage.entries())
        .map(([app, usage]) => ({ app, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10),
      expirationTimes: expirationTimes
        .sort((a, b) => a.expiresIn - b.expiresIn)
        .slice(0, 20),
      memoryDistribution: {
        totalEntries: this.cache.size,
        avgEntrySize: this.stats.memoryUsageBytes / Math.max(1, this.cache.size)
      }
    };
  }

  /**
   * Evict entries based on policy
   */
  private evictEntries(count: number): void {
    const entries = Array.from(this.cache.entries());
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu':
        entries.sort(([, a], [, b]) => a.hits - b.hits);
        break;
      case 'ttl':
        entries.sort(([, a], [, b]) => a.expiresAt - b.expiresAt);
        break;
    }

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.entries = this.cache.size;
    this.stats.hitRate = this.stats.hits / Math.max(1, this.stats.hits + this.stats.misses);
    
    // Estimate memory usage
    this.stats.memoryUsageBytes = this.cache.size * 1024; // Rough estimate
  }

  /**
   * Get TTL based on application context
   */
  private getTtlForContext(app: ApplicationContext): number {
    const ttlMap: Record<ApplicationContext, number> = {
      'ai-receptionist': 2 * 60 * 1000,      // 2 minutes - real-time
      'clinical-staffing': 30 * 60 * 1000,   // 30 minutes - planning
      'checkin-kiosk': 5 * 60 * 1000,        // 5 minutes - patient flow
      'eos-l10': 60 * 60 * 1000,             // 1 hour - business intelligence
      'inventory': 15 * 60 * 1000,           // 15 minutes - stock data
      'handouts': 2 * 60 * 60 * 1000,        // 2 hours - educational content
      'medication-auth': 10 * 60 * 1000,     // 10 minutes - auth sensitive
      'pharma-scheduling': 4 * 60 * 60 * 1000, // 4 hours - meeting schedules
      'call-center-ops': 5 * 60 * 1000,      // 5 minutes - operational
      'batch-closeout': 60 * 60 * 1000,      // 1 hour - financial
      'socials-reviews': 6 * 60 * 60 * 1000, // 6 hours - social content
      'compliance-training': 24 * 60 * 60 * 1000, // 24 hours - training
      'platform-dashboard': 15 * 60 * 1000,  // 15 minutes - metrics
      'config-dashboard': 60 * 60 * 1000,    // 1 hour - configuration
      'component-showcase': 60 * 60 * 1000,  // 1 hour - demos
      'staff': 30 * 60 * 1000,               // 30 minutes - general staff
      'integration-status': 10 * 60 * 1000   // 10 minutes - status
    };

    return ttlMap[app] || this.config.defaultTtlMs;
  }

  /**
   * Basic similarity calculation (Jaccard similarity)
   */
  private calculateSimilarity(key1: string, key2: string): number {
    const set1 = new Set(key1.split(''));
    const set2 = new Set(key2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
}

/**
 * Singleton instance for easy access
 */
export const defaultAICache = new AIResponseCache();